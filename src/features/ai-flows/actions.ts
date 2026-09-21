"use server";

import { revalidatePath } from "next/cache";
import { createClient, getTenantId } from "@/lib/supabase/server";

export async function applyEnrichmentAction(items: { sku: string; filled: Record<string, string | null> }[]) {
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);

  const { data: products } = await supabase
    .from("products")
    .select("id, sku, attrs")
    .eq("tenant_id", tenantId)
    .in("sku", items.map((i) => i.sku));
  const productBySku = Object.fromEntries((products ?? []).map((p) => [p.sku, p]));

  for (const item of items) {
    const values = Object.fromEntries(Object.entries(item.filled).filter(([, v]) => v));
    if (Object.keys(values).length === 0) continue;

    const product = productBySku[item.sku];
    if (!product) continue;

    const { error } = await supabase
      .from("products")
      .update({ attrs: { ...(product.attrs as Record<string, string>), ...values } })
      .eq("id", product.id);
    if (error) return { error: error.message };
  }

  revalidatePath("/products");
  revalidatePath("/ai/enrich");
  return { ok: true };
}

// Confirma a entrada lida pela IA: produtos "existing" entram por
// fn_stock_entry (mesma função do lançamento manual); "new" são
// cadastrados primeiro, na categoria que a IA casou (precisa já existir
// no esquema — a IA nunca inventa categoria).
export async function confirmInvoiceEntryAction(input: {
  storeId: string;
  items: {
    match: "existing" | "new";
    sku: string;
    productName: string;
    category: string;
    attributes: Record<string, string>;
    qty: number;
    unitCost: number;
  }[];
  invoiceRef: string;
}) {
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);
  const notes = input.invoiceRef ? `Entrada por leitura de nota — NF ${input.invoiceRef}` : "Entrada por leitura de nota";

  const existingSkus = input.items.filter((i) => i.match === "existing").map((i) => i.sku);
  const [{ data: existingProducts }, { data: categories }] = await Promise.all([
    existingSkus.length
      ? supabase.from("products").select("id, sku").eq("tenant_id", tenantId).in("sku", existingSkus)
      : Promise.resolve({ data: [] }),
    supabase.from("categories").select("id, name").eq("tenant_id", tenantId),
  ]);
  const productIdBySku = Object.fromEntries((existingProducts ?? []).map((p) => [p.sku, p.id]));
  const categoryIdByName = Object.fromEntries((categories ?? []).map((c) => [c.name.toLowerCase(), c.id]));

  for (const item of input.items) {
    let productId: string | null = null;

    if (item.match === "existing") {
      productId = productIdBySku[item.sku] ?? null;
      if (!productId) return { error: `SKU ${item.sku} não encontrado no catálogo.` };
    } else {
      const categoryId = categoryIdByName[item.category.toLowerCase()];
      if (!categoryId) return { error: `Categoria "${item.category}" não existe — cadastre-a antes de confirmar.` };

      // A nota só traz custo — preço de venda nasce igual ao custo (margem
      // 0%) até o lojista ajustar no catálogo; evita gravar sale_price
      // zerado, que pareceria um produto de graça.
      const { data: created, error: createError } = await supabase
        .from("products")
        .insert({
          tenant_id: tenantId, category_id: categoryId, sku: item.sku, brand: "", name: item.productName,
          attrs: item.attributes, cost_price: item.unitCost, sale_price: item.unitCost, min_stock: 0,
        })
        .select("id")
        .single();
      if (createError) return { error: createError.message };
      productId = created.id;
    }

    const { error: entryError } = await supabase.rpc("fn_stock_entry", {
      p_store_id: input.storeId, p_product_id: productId, p_qty: item.qty, p_unit_cost: item.unitCost, p_notes: notes,
    });
    if (entryError) return { error: entryError.message };
  }

  revalidatePath("/stock/history");
  revalidatePath("/products");
  return { ok: true };
}
