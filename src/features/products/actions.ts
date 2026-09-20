"use server";

import { revalidatePath } from "next/cache";
import { createClient, getTenantId } from "@/lib/supabase/server";

export async function createCategoryAction(input: {
  name: string;
  code: string;
  unit: string;
  icon?: string;
  color?: string;
  attributes: { key: string; label: string; type: "color" | "size" | "spec"; values: string[] }[];
}) {
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);

  const { data: category, error } = await supabase
    .from("categories")
    .insert({
      tenant_id: tenantId,
      name: input.name,
      code: input.code.toUpperCase(),
      unit: input.unit,
      unit_plural: input.unit,
      icon: input.icon || "Box",
      color: input.color || "#6B7280",
    })
    .select("id")
    .single();
  if (error) return { error: error.code === "23505" ? "Já existe uma categoria com esse prefixo." : error.message };

  const attrRows = input.attributes.filter((a) => a.key && a.label);
  if (attrRows.length) {
    const { error: attrError } = await supabase.from("category_attributes").insert(
      attrRows.map((a, i) => ({
        category_id: category.id,
        key: a.key,
        label: a.label,
        type: a.type,
        values: a.values,
        position: i,
      })),
    );
    if (attrError) return { error: attrError.message };
  }

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
    return { error: error.code === "23505" ? "Já existe um produto com esse SKU ou código de barras." : error.message };
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
  const supabase = await createClient();

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
    return { error: error.code === "23505" ? "Já existe um produto com esse SKU ou código de barras." : error.message };
  }

  revalidatePath("/products");
  revalidatePath("/products/detail");
  revalidatePath("/products/edit");
  return { id: input.id };
}

export async function uploadProductPhotoAction(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Nenhum arquivo enviado." };

  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);
  const path = `${tenantId}/${crypto.randomUUID()}-${file.name}`;

  const { error } = await supabase.storage.from("product-photos").upload(path, file);
  if (error) return { error: error.message };

  const { data } = supabase.storage.from("product-photos").getPublicUrl(path);
  return { url: data.publicUrl };
}
