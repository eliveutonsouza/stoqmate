"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function checkExistingSkusAction(skus: string[]) {
  if (!skus.length) return { existing: [] };
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("sku").in("sku", skus);
  if (error) return { error: error.message };
  return { existing: (data ?? []).map((p) => p.sku) };
}

export async function bulkImportProductsAction(input: {
  storeId: string;
  onDuplicate: "update" | "skip";
  items: {
    sku: string; barcode: string; categoryCode: string; brand: string; name: string;
    costPrice: number; salePrice: number; minStock: number; initialQty: number;
  }[];
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_bulk_import_products", {
    p_store_id: input.storeId,
    p_on_duplicate: input.onDuplicate,
    p_items: input.items.map((i) => ({
      sku: i.sku, barcode: i.barcode, category_code: i.categoryCode, brand: i.brand, name: i.name,
      cost_price: i.costPrice, sale_price: i.salePrice, min_stock: i.minStock, initial_qty: i.initialQty,
    })),
  });
  if (error) {
    if (error.message.includes("not authorized")) return { error: "Seu perfil não tem permissão para importar produtos." };
    return { error: error.message };
  }
  revalidatePath("/products");
  revalidatePath("/categories");
  return data as { created: number; updated: number; skipped: number; errors: { sku: string; error: string }[] };
}
