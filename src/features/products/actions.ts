"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkImage, uploadPath } from "@/lib/image-upload";
import { createClient, getTenantId } from "@/lib/supabase/server";
import { limitKindFromError } from "@/lib/plan-limits";
import { NOT_FOUND_ERROR, userMessage } from "@/lib/errors";
import { isOwnStorageUrl, isUuid, textError } from "@/lib/validation";
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

type ProductInput = {
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
};

// Mesma regra do formulário, refeita aqui: a action é endpoint público.
function productInputError(input: ProductInput): string | null {
  if (!isUuid(input.categoryId)) return "Selecione a categoria.";
  if (input.supplierId != null && !isUuid(input.supplierId)) return "Fornecedor inválido.";
  if (input.defaultLocationId != null && !isUuid(input.defaultLocationId)) return "Local inválido.";
  const text = textError(input.brand, "a marca", 1, 80) ?? textError(input.name, "o nome do produto", 2, 160) ?? textError(input.sku, "o SKU", 1, 60);
  if (text) return text;
  if (typeof input.barcode === "string" && input.barcode.length > 50) return "Código de barras longo demais.";
  if (typeof input.notes === "string" && input.notes.length > 2000) return "Observações longas demais (máximo 2.000 caracteres).";
  const money = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 10_000_000;
  if (!money(input.costPrice) || !money(input.salePrice)) return "Preço inválido.";
  if (!Number.isInteger(input.minStock) || input.minStock < 0 || input.minStock > 1_000_000) return "Estoque mínimo inválido.";
  if (!input.attrs || typeof input.attrs !== "object" || Array.isArray(input.attrs)
    || Object.entries(input.attrs).some(([k, v]) => typeof v !== "string" || k.length > 40 || v.length > 60)) return "Atributos inválidos.";
  if (input.photoUrl && !isOwnStorageUrl(input.photoUrl, "product-photos")) return "Foto inválida — envie a imagem pelo botão de upload.";
  return null;
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
  const invalid = productInputError(input);
  if (invalid) return { error: invalid };
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase).catch(() => null);
  if (!tenantId) return { error: "Sessão expirada. Entre de novo." };

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      tenant_id: tenantId,
      category_id: input.categoryId,
      sku: input.sku.trim(),
      barcode: input.barcode?.trim() || null,
      brand: input.brand.trim(),
      name: input.name.trim(),
      attrs: input.attrs,
      cost_price: input.costPrice,
      sale_price: input.salePrice,
      min_stock: input.minStock,
      supplier_id: input.supplierId,
      default_location_id: input.defaultLocationId,
      notes: input.notes?.trim() || null,
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
  if (!isUuid(input.id)) return { error: "Produto inválido." };
  const invalid = productInputError(input);
  if (invalid) return { error: invalid };
  const supabase = await createClient();

  const { data: before, error: beforeError } = await supabase.from("products").select("sale_price, name").eq("id", input.id).maybeSingle();
  if (beforeError) return { error: userMessage(beforeError, "products/update.before") };
  if (!before) return { error: NOT_FOUND_ERROR };

  const { data: updated, error } = await supabase
    .from("products")
    .update({
      category_id: input.categoryId,
      sku: input.sku.trim(),
      barcode: input.barcode?.trim() || null,
      brand: input.brand.trim(),
      name: input.name.trim(),
      attrs: input.attrs,
      cost_price: input.costPrice,
      sale_price: input.salePrice,
      min_stock: input.minStock,
      supplier_id: input.supplierId,
      default_location_id: input.defaultLocationId,
      notes: input.notes?.trim() || null,
      ...(input.photoUrl ? { photo_url: input.photoUrl } : {}),
    })
    .eq("id", input.id)
    .select("id");
  if (error) {
    return { error: error.code === "23505" ? "Já existe um produto com esse SKU ou código de barras." : userMessage(error, "products/actions") };
  }
  if (!updated?.length) return { error: NOT_FOUND_ERROR };

  const previousSalePrice = Number(before.sale_price);
  if (previousSalePrice !== input.salePrice) {
    const { error: auditError } = await supabase.rpc("fn_write_audit", {
      p_kind: "price",
      p_message: `Alterou preço de venda de ${before.name} de R$ ${previousSalePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} para R$ ${input.salePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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
  if (!isUuid(input.id) || typeof input.active !== "boolean") return { error: "Produto inválido." };
  const supabase = await createClient();
  const { data: updated, error } = await supabase.from("products").update({ active: input.active }).eq("id", input.id).select("id");
  if (error) {
    const limit = limitKindFromError(error.message);
    if (limit) redirect(`/limit-reached?kind=${limit}`);
    return { error: userMessage(error, "products/actions") };
  }
  if (!updated?.length) return { error: NOT_FOUND_ERROR };
  revalidatePath("/products");
  revalidatePath("/products/detail");
  return { ok: true };
}

// Cópia sem código de barras (é único) e com SKU novo — abre direto na
// edição pra ajustar a variação.
export async function duplicateProductAction(id: string) {
  if (!isUuid(id)) return { error: "Produto não encontrado." };
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
  const tenantId = await getTenantId(supabase).catch(() => null);
  if (!tenantId) return { error: "Sessão expirada. Entre de novo." };
  const path = uploadPath(tenantId, checked.ext);

  const { error } = await supabase.storage.from("product-photos").upload(path, file as File);
  if (error) return { error: userMessage(error, "products/actions") };

  const { data } = supabase.storage.from("product-photos").getPublicUrl(path);
  return { url: data.publicUrl };
}

// Esquema da categoria: só ACRESCENTA valores a um atributo (ex.: cor nova).
// Remover ou renomear valor deixaria produtos com atributo órfão e SKU
// inconsistente — fica de fora de propósito.
export async function addAttributeValuesAction(input: { attributeId: string; values: string[] }) {
  if (!isUuid(input.attributeId)) return { error: "Atributo inválido." };
  const incoming = (Array.isArray(input.values) ? input.values : [])
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0 && v.length <= 40);
  if (!incoming.length) return { error: "Informe ao menos um valor (até 40 caracteres)." };

  const supabase = await createClient();
  const { data: attr, error: readError } = await supabase.from("category_attributes").select("id, values").eq("id", input.attributeId).maybeSingle();
  if (readError) return { error: userMessage(readError, "products/addAttributeValues.read") };
  if (!attr) return { error: "Atributo não encontrado." };

  const current = (attr.values ?? []) as string[];
  const lower = new Set(current.map((v) => v.toLowerCase()));
  const added = incoming.filter((v) => !lower.has(v.toLowerCase()) && lower.add(v.toLowerCase()));
  if (!added.length) return { error: "Esses valores já existem neste atributo." };
  if (current.length + added.length > 200) return { error: "Limite de 200 valores por atributo." };

  const { error } = await supabase.from("category_attributes").update({ values: [...current, ...added] }).eq("id", attr.id);
  if (error) return { error: userMessage(error, "products/addAttributeValues") };
  revalidatePath("/categories");
  revalidatePath("/products/new");
  return { added };
}
