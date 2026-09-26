"use server";

import { revalidatePath } from "next/cache";
import { createClient, getTenantId } from "@/lib/supabase/server";
import { userMessage } from "@/lib/errors";
import { isUuid } from "@/lib/validation";

export async function applyEnrichmentAction(items: { sku: string; filled: Record<string, string | null> }[]) {
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);

  const { data: products, error: readError } = await supabase
    .from("products")
    .select("id, sku, attrs")
    .eq("tenant_id", tenantId)
    .in("sku", items.map((i) => i.sku));
  if (readError) return { error: userMessage(readError, "ai-flows/applyEnrichment.read") };
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
    if (error) return { error: userMessage(error, "ai-flows/actions") };
  }

  revalidatePath("/products");
  revalidatePath("/ai/enrich");
  return { ok: true };
}

// Confirma a entrada lida pela IA: produtos "existing" entram por
// fn_stock_entry (mesma função do lançamento manual); "new" são
// cadastrados primeiro, na categoria que a IA casou (precisa já existir
// no esquema — a IA nunca inventa categoria).
function schemaAttributes(raw: Record<string, string> | undefined, keyByName: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(raw ?? {})) {
    const key = keyByName[name.toLowerCase()];
    if (key && typeof value === "string" && value.trim()) out[key] = value.trim();
  }
  return out;
}

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
  if (!isUuid(input.storeId)) return { error: "Unidade inválida." };
  if (!Array.isArray(input.items) || input.items.length === 0) return { error: "Nenhum item para lançar." };
  if (input.items.length > 300) return { error: "Nota com itens demais para uma entrada só (máximo 300)." };
  const badItem = input.items.find((i) => !Number.isInteger(i.qty) || i.qty <= 0 || !(Number(i.unitCost) >= 0) || !i.sku);
  if (badItem) return { error: `Quantidade ou custo inválido no item ${badItem.sku || badItem.productName}.` };

  const supabase = await createClient();
  const notes = input.invoiceRef ? `Entrada por leitura de nota — NF ${input.invoiceRef}` : "Entrada por leitura de nota";

  const needsCategory = input.items.some((i) => i.match === "new");
  let categoryIdByName: Record<string, string> = {};
  // A IA pode devolver o atributo pelo rótulo ("Cor") em vez da chave ("cor").
  const attrKeyByCategory: Record<string, Record<string, string>> = {};
  if (needsCategory) {
    const { data: categories, error } = await supabase.from("categories").select("id, name, category_attributes(key, label)");
    if (error) return { error: userMessage(error, "ai-flows/confirmInvoice.categories") };
    categoryIdByName = Object.fromEntries((categories ?? []).map((c) => [c.name.toLowerCase(), c.id]));
    for (const c of categories ?? []) {
      const byName: Record<string, string> = {};
      for (const a of c.category_attributes ?? []) {
        byName[a.key.toLowerCase()] = a.key;
        byName[a.label.toLowerCase()] = a.key;
      }
      attrKeyByCategory[c.id] = byName;
    }
  }

  const items = [];
  for (const item of input.items) {
    let categoryId: string | null = null;
    if (item.match === "new") {
      categoryId = categoryIdByName[item.category.toLowerCase()] ?? null;
      if (!categoryId) return { error: `Categoria "${item.category}" não existe — cadastre-a antes de confirmar.` };
    }
    items.push({
      match: item.match === "new" ? "new" : "existing", sku: item.sku, product_name: item.productName,
      category_id: categoryId, attributes: categoryId ? schemaAttributes(item.attributes, attrKeyByCategory[categoryId] ?? {}) : {},
      qty: item.qty, unit_cost: item.unitCost,
    });
  }

  // Tudo ou nada: cadastro dos produtos novos + entradas numa transação
  // (fn_confirm_invoice_entry). Antes uma falha no meio deixava metade da
  // nota lançada.
  const { error } = await supabase.rpc("fn_confirm_invoice_entry", { p_store_id: input.storeId, p_items: items, p_notes: notes });
  if (error) {
    return { error: userMessage(error, "ai-flows/confirmInvoice", { "duplicate key": "Um SKU novo da nota já existe no catálogo — marque-o como existente." }) };
  }

  revalidatePath("/stock/history");
  revalidatePath("/products");
  return { ok: true };
}
