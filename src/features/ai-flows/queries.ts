import { createClient } from "@/lib/supabase/server";

// Produtos com pelo menos 1 atributo do esquema da categoria ainda vazio —
// substitui o array mockado GAPS. "Vazio" = chave do esquema ausente de
// products.attrs ou com valor vazio.
export async function loadEnrichGaps(limit = 20) {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, sku, name, attrs, category:categories(id, name, icon, color, code, category_attributes(key))")
    .eq("active", true)
    .limit(200);

  const gaps = (products ?? [])
    .map((p) => {
      const category = p.category as unknown as { id: string; name: string; icon: string; color: string; code: string; category_attributes: { key: string }[] } | null;
      const schemaKeys = (category?.category_attributes ?? []).map((a) => a.key);
      const known = (p.attrs ?? {}) as Record<string, string>;
      const missing = schemaKeys.filter((k) => !known[k]);
      return { id: p.id, sku: p.sku, name: p.name, category, known, missing };
    })
    .filter((g) => g.missing.length > 0)
    .slice(0, limit);

  return gaps;
}

export async function loadForecastBase(storeId: string, limit = 15) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("fn_replenishment_suggestions", { p_store_id: storeId });
  return (data ?? [])
    .filter((r: { suggest_qty: number }) => r.suggest_qty > 0)
    .slice(0, limit);
}

export async function loadOcrContext() {
  const supabase = await createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id, name, unit, category_attributes(key, label, values)").order("name"),
    supabase.from("products").select("sku, brand, name, attrs, cost_price").eq("active", true).limit(300),
  ]);
  return { categories: categories ?? [], products: products ?? [] };
}
