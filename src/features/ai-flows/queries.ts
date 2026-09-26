import { createClient } from "@/lib/supabase/server";
import { must } from "@/lib/supabase/must";
import { loadStores } from "@/features/stock/queries";
import { resolveStoreId } from "@/features/shell/queries";
import { productCostMap } from "@/lib/supabase/costs";

// Produtos com pelo menos 1 atributo do esquema da categoria ainda vazio —
// substitui o array mockado GAPS. "Vazio" = chave do esquema ausente de
// products.attrs ou com valor vazio.
export async function loadEnrichGaps(limit = 20) {
  const supabase = await createClient();
  const products = must(await supabase
    .from("products")
    .select("id, sku, name, attrs, category:categories(id, name, icon, color, code, category_attributes(key))")
    .eq("active", true)
    .limit(200), "ai-flows/queries.loadEnrichGaps.products");

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
  const data = must(await supabase.rpc("fn_replenishment_suggestions", { p_store_id: storeId }), "ai-flows/queries.loadForecastBase.data");
  return (data ?? [])
    .filter((r: { suggest_qty: number }) => r.suggest_qty > 0)
    .slice(0, limit);
}

// Detecção de anomalia sem IA — 2 sinais computáveis direto de dado real
// (os outros tipos do mock original, "estoque fantasma"/"padrão de perda
// por horário", exigiriam correlação estatística que este projeto não
// tem infraestrutura pra calcular ainda — cortados em vez de fingidos).
export async function loadAnomalies(storeId: string) {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const [suggestionsRes, balancesRes, recentSalesRes] = await Promise.all([
    supabase.rpc("fn_replenishment_suggestions", { p_store_id: storeId }),
    supabase
      .from("stock_balances")
      .select("product_id, qty, product:products(sku, name, brand, attrs, category:categories(id, name, icon, color))")
      .eq("store_id", storeId),
    supabase.rpc("fn_products_sold_since", { p_store_id: storeId, p_since: since.toISOString() }),
  ]);
  const suggestions = must(suggestionsRes, "ai-flows/queries.loadAnomalies.suggestions");
  const balances = must(balancesRes, "ai-flows/queries.loadAnomalies.balances");
  const recentSales = must(recentSalesRes, "ai-flows/queries.loadAnomalies.recentSales");

  const stockouts = (suggestions ?? [])
    .filter((s: { stock: number; sold_30d: number }) => s.stock === 0 && s.sold_30d > 0)
    .map((s: { product_id: string; sku: string; name: string; attrs: unknown; category: unknown; sold_30d: number; cost_price: number }) => ({
      productId: s.product_id, sku: s.sku, name: s.name, attrs: s.attrs, category: s.category,
      soldPerDay: s.sold_30d / 30, lossEstimate: (s.sold_30d / 30) * 7 * s.cost_price,
    }));

  const soldRecently = new Set((recentSales ?? []) as string[]);
  const costById = await productCostMap(supabase, (balances ?? []).map((b) => b.product_id));
  const deadStock = (balances ?? [])
    .filter((b) => b.qty > 0 && !soldRecently.has(b.product_id))
    .map((b) => ({
      productId: b.product_id, qty: b.qty, product: b.product,
      value: b.qty * (costById.get(b.product_id) ?? 0),
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return { stockouts, deadStock };
}

export async function loadOcrContext() {
  const supabase = await createClient();
  const [categoriesRes, productsRes] = await Promise.all([
    supabase.from("categories").select("id, name, unit, category_attributes(key, label, values)").order("name"),
    supabase.from("products").select("id, sku, brand, name, attrs").eq("active", true).limit(300),
  ]);
  const categories = must(categoriesRes, "ai-flows/queries.loadOcrContext.categories");
  const products = must(productsRes, "ai-flows/queries.loadOcrContext.products") ?? [];
  const costById = await productCostMap(supabase, products.map((p) => p.id));
  return { categories: categories ?? [], products: products.map((p) => ({ ...p, cost_price: costById.get(p.id) ?? null })) };
}

// Telas de IA que dependem de loja usam a loja ativa da sidebar.
async function activeStoreForAi() {
  const stores = await loadStores();
  return resolveStoreId(stores);
}

export async function loadAnomaliesScreen() {
  const storeId = await activeStoreForAi();
  return storeId ? loadAnomalies(storeId) : { stockouts: [], deadStock: [] };
}

export async function loadForecastScreen() {
  const storeId = await activeStoreForAi();
  return storeId ? loadForecastBase(storeId) : [];
}

// Contagem de pendências da fila de IA (hub e fila mostram o mesmo número).
export async function loadAiQueueCounts() {
  const storeId = await activeStoreForAi();
  const [enrichGaps, forecastBase, anomalies] = await Promise.all([
    loadEnrichGaps(),
    storeId ? loadForecastBase(storeId) : Promise.resolve([]),
    storeId ? loadAnomalies(storeId) : Promise.resolve({ stockouts: [], deadStock: [] }),
  ]);
  const anomalyCount = anomalies.stockouts.length + anomalies.deadStock.length;
  return {
    enrichCount: enrichGaps.length,
    forecastCount: forecastBase.length,
    anomalyCount,
    pendingCount: enrichGaps.length + forecastBase.length + anomalyCount,
  };
}
