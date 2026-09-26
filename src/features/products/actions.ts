"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkImage, uploadPath } from "@/lib/image-upload";
import { createClient, getTenantId } from "@/lib/supabase/server";
import { limitKindFromError } from "@/lib/plan-limits";
import { userMessage } from "@/lib/errors";
import { textError } from "@/lib/validation";
import { isOwnStorageUrl } from "@/lib/validation";
import { productCostMap } from "@/lib/supabase/costs";

export async function createCategoryAction(input: {
  name: string;
  code: string;
  unit: string;
  icon?: string;
  color?: string;
  attributes: { key: string; label: string; type: "color" | "size" | "spec"; values: string[] }[];
}) {
  const invalid = textError(input.name, "o nome da categoria", 2, 60) ?? textError(input.code, "o prefixo", 2, 8);
  if (invalid) return { error: invalid };
  const supabase = await createClient();

  // Categoria + atributos numa transação (fn_create_category).
  const { data: categoryId, error } = await supabase.rpc("fn_create_category", {
    p_category: { name: input.name.trim(), code: input.code.trim(), unit: input.unit, icon: input.icon ?? "", color: input.color ?? "" },
    p_attributes: input.attributes.filter((a) => a.key && a.label)
      .map((a) => ({ key: a.key, label: a.label, type: a.type, values: a.values })),
  });
  if (error) {
    return { error: userMessage(error, "products/createCategory", { categories_tenant_id_code_key: "Já existe uma categoria com esse prefixo." }) };
  }
  const category = { id: categoryId as string };

  revalidatePath("/categories");
  revalidatePath("/products");
  revalidatePath("/products/new");
  return { id: category.id as string };
}

export async function createProductAction(input: {
  categoryId: string;
  brand: string;
  name: string;
  sku: string;
  barcode: string;
  attrs: Record<string, string>;
  costPrice: number;
  salePrice: number;
  minStock: number;
  supplierId: string | null;
  defaultLocationId: string | null;
  notes: string;
  photoUrl: string | null;
}) {
  if (input.photoUrl && !isOwnStorageUrl(input.photoUrl, "product-photos")) return { error: "Foto inválida — envie a imagem pelo botão de upload." };
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      tenant_id: tenantId,
      category_id: input.categoryId,
      sku: input.sku,
      barcode: input.barcode || null,
      brand: input.brand,
      name: input.name,
      attrs: input.attrs,
      cost_price: input.costPrice,
      sale_price: input.salePrice,
      min_stock: input.minStock,
      supplier_id: input.supplierId,
      default_location_id: input.defaultLocationId,
      notes: input.notes || null,
      photo_url: input.photoUrl,
    })
    .select("id")
    .single();
  if (error) {
    const limit = limitKindFromError(error.message);
    if (limit) redirect(`/limit-reached?kind=${limit}`);
    return { error: error.code === "23505" ? "Já existe um produto com esse SKU ou código de barras." : userMessage(error, "products/actions") };
  }

  revalidatePath("/products");
  return { id: product.id as string };
}

export async function updateProductAction(input: {
  id: string;
  categoryId: string;
  brand: string;
  name: string;
  sku: string;
  barcode: string;
  attrs: Record<string, string>;
  costPrice: number;
  salePrice: number;
  minStock: number;
  supplierId: string | null;
  defaultLocationId: string | null;
  notes: string;
  photoUrl: string | null;
}) {
  if (input.photoUrl && !isOwnStorageUrl(input.photoUrl, "product-photos")) return { error: "Foto inválida — envie a imagem pelo botão de upload." };
  const supabase = await createClient();

  const { data: before, error: beforeError } = await supabase.from("products").select("sale_price, name").eq("id", input.id).maybeSingle();
  if (beforeError) return { error: userMessage(beforeError, "products/update.before") };

  const { error } = await supabase
    .from("products")
    .update({
      category_id: input.categoryId,
      sku: input.sku,
      barcode: input.barcode || null,
      brand: input.brand,
      name: input.name,
      attrs: input.attrs,
      cost_price: input.costPrice,
      sale_price: input.salePrice,
      min_stock: input.minStock,
      supplier_id: input.supplierId,
      default_location_id: input.defaultLocationId,
      notes: input.notes || null,
      ...(input.photoUrl ? { photo_url: input.photoUrl } : {}),
    })
    .eq("id", input.id);
  if (error) {
    return { error: error.code === "23505" ? "Já existe um produto com esse SKU ou código de barras." : userMessage(error, "products/actions") };
  }

  const previousSalePrice = before ? Number(before.sale_price) : null;
  if (before && previousSalePrice !== null && previousSalePrice !== input.salePrice) {
    const { error: auditError } = await supabase.rpc("fn_write_audit", {
      p_kind: "price",
      p_message: `Alterou preço de venda de ${before.name} de R$ ${previousSalePrice.toFixed(2)} para R$ ${input.salePrice.toFixed(2)}`,
      p_target_type: "product",
      p_target_id: input.id,
    });
    // Auditoria não desfaz a operação já gravada, mas a falha não pode sumir.
    if (auditError) console.error(`[audit] falhou: ${auditError.message}`);
  }

  revalidatePath("/products");
  revalidatePath("/products/detail");
  revalidatePath("/products/edit");
  return { id: input.id };
}

export async function setProductActiveAction(input: { id: string; active: boolean }) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ active: input.active }).eq("id", input.id);
  if (error) {
    const limit = limitKindFromError(error.message);
    if (limit) redirect(`/limit-reached?kind=${limit}`);
    return { error: userMessage(error, "products/actions") };
  }
  revalidatePath("/products");
  return { ok: true };
}

// Cópia sem código de barras (é único) e com SKU novo — abre direto na
// edição pra ajustar a variação.
export async function duplicateProductAction(id: string) {
  const supabase = await createClient();
  const { data: src, error: readError } = await supabase
    .from("products")
    .select("tenant_id, category_id, sku, brand, name, attrs, sale_price, min_stock, supplier_id, default_location_id, notes, photo_url")
    .eq("id", id)
    .maybeSingle();
  if (readError || !src) return { error: "Produto não encontrado." };
  const costById = await productCostMap(supabase, [id]);
  if (!costById.has(id)) return { error: "Seu perfil não tem permissão para duplicar produtos." };

  const { data: taken, error: takenError } = await supabase.from("products").select("sku").like("sku", `${src.sku.replace(/[\\%_]/g, "\\$&")}-COPIA%`);
  if (takenError) return { error: userMessage(takenError, "products/duplicate.taken") };
  const used = new Set((taken ?? []).map((t) => t.sku));
  let sku = `${src.sku}-COPIA`;
  for (let n = 2; used.has(sku); n++) sku = `${src.sku}-COPIA${n}`;

  const { data: copy, error } = await supabase
    .from("products")
    .insert({ ...src, cost_price: costById.get(id), sku, name: `${src.name} (cópia)` })
    .select("id")
    .single();
  if (error) {
    const limit = limitKindFromError(error.message);
    if (limit) redirect(`/limit-reached?kind=${limit}`);
    return { error: userMessage(error, "products/actions") };
  }
  revalidatePath("/products");
  return { id: copy.id as string };
}

export async function uploadProductPhotoAction(formData: FormData) {
  const file = formData.get("file");
  const checked = checkImage(file, 4);
  if ("error" in checked) return checked;

  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);
  const path = uploadPath(tenantId, checked.ext);

  const { error } = await supabase.storage.from("product-photos").upload(path, file as File);
  if (error) return { error: userMessage(error, "products/actions") };

  const { data } = supabase.storage.from("product-photos").getPublicUrl(path);
  return { url: data.publicUrl };
}
