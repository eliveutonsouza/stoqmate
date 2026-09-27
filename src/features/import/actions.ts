"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { limitKindFromError } from "@/lib/plan-limits";
import { userMessage } from "@/lib/errors";
import { isUuid } from "@/lib/validation";

const MAX_IMPORT = 5000;

export async function checkExistingSkusAction(skus: string[]) {
  if (!Array.isArray(skus) || skus.length > MAX_IMPORT || skus.some((s) => typeof s !== "string" || s.length > 60)) return { error: "Lista de SKUs inválida." };
  if (!skus.length) return { existing: [] };
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("sku").in("sku", skus);
  if (error) return { error: userMessage(error, "import/actions") };
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
  if (!isUuid(input.storeId)) return { error: "Selecione a unidade." };
  if (input.onDuplicate !== "update" && input.onDuplicate !== "skip") return { error: "Opção de duplicados inválida." };
  if (!Array.isArray(input.items) || !input.items.length) return { error: "Nenhum produto para importar." };
  if (input.items.length > MAX_IMPORT) return { error: `No máximo ${MAX_IMPORT.toLocaleString("pt-BR")} produtos por importação.` };
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
    const limit = limitKindFromError(error.message);
    if (limit) redirect(`/limit-reached?kind=${limit}`);
    if (error.message.includes("not authorized")) return { error: "Seu perfil não tem permissão para importar produtos." };
    return { error: userMessage(error, "import/actions") };
  }
  revalidatePath("/products");
  revalidatePath("/categories");
  revalidatePath("/stock/history");
  return data as { created: number; updated: number; skipped: number; errors: { sku: string; error: string }[] };
}
