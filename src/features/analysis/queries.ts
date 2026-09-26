import { createClient } from "@/lib/supabase/server";
import { must } from "@/lib/supabase/must";
import { loadSalesReport } from "@/features/reports/queries";
import { productCostMap } from "@/lib/supabase/costs";

export async function loadNetworkData() {
  const supabase = await createClient();
  const [salesReport, overviewRes, storesRes, balanceRowsRes] = await Promise.all([
    loadSalesReport(),
    supabase.rpc("fn_stock_overview"),
    supabase.from("stores").select("id, name, type").order("name"),
    supabase.from("stock_balances").select("product_id, store_id, qty, product:products(sku, name, brand, attrs, category:categories(id, name, icon, color))"),
  ]);
  const overview = must(overviewRes, "analysis.loadNetworkData.overview") as { total_qty: number; rupture_count: number } | null;
  const stores = must(storesRes, "analysis.loadNetworkData.stores");
  const balanceRows = must(balanceRowsRes, "analysis.loadNetworkData.balanceRows");

  const revenueByStore = new Map((salesReport.byStore ?? []).map((s: { store_id: string; revenue: number }) => [s.store_id, s.revenue]));
  const skuCountByStore = new Map<string, number>();
  const qtyByStore = new Map<string, number>();
  const byProduct = new Map<string, { qty: number; product: unknown }[]>();
  for (const row of balanceRows ?? []) {
    if (row.qty > 0) skuCountByStore.set(row.store_id, (skuCountByStore.get(row.store_id) ?? 0) + 1);
    qtyByStore.set(row.store_id, (qtyByStore.get(row.store_id) ?? 0) + row.qty);
    const arr = byProduct.get(row.product_id) ?? [];
    arr.push({ qty: row.qty, product: row.product });
    byProduct.set(row.product_id, arr);
  }

  const storeRows = (stores ?? []).map((s) => ({
    ...s, revenue: revenueByStore.get(s.id) ?? 0, skuCount: skuCountByStore.get(s.id) ?? 0, qty: qtyByStore.get(s.id) ?? 0,
  }));

  const imbalance = [...byProduct.entries()]
    .filter(([, rows]) => rows.length >= 2)
    .map(([productId, rows]) => {
      const sorted = [...rows].sort((a, b) => a.qty - b.qty);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      return { productId, product: max.product, min, max, gap: max.qty - min.qty };
    })
    .filter((r) => r.gap >= 10)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 8);

  return {
    revenue: salesReport.revenue,
    margin: salesReport.revenue > 0 ? ((salesReport.revenue - salesReport.cost) / salesReport.revenue) * 100 : 0,
    totalQty: overview?.total_qty ?? 0,
    ruptureCount: overview?.rupture_count ?? 0,
    stores: storeRows,
    imbalance,
  };
}

export async function loadPricingScopeOptions() {
  const supabase = await createClient();
  const [suppliersRes, categoriesRes, brandRowsRes] = await Promise.all([
    supabase.from("suppliers").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("products").select("brand").not("brand", "is", null).order("brand"),
  ]);
  const suppliers = must(suppliersRes, "analysis/queries.loadPricingScopeOptions.suppliers");
  const categories = must(categoriesRes, "analysis/queries.loadPricingScopeOptions.categories");
  const brandRows = must(brandRowsRes, "analysis/queries.loadPricingScopeOptions.brandRows");
  const brands = [...new Set((brandRows ?? []).map((p) => p.brand).filter(Boolean))];
  return { suppliers: suppliers ?? [], categories: categories ?? [], brands };
}

export async function loadPricingPreview(scope: "supplier" | "category" | "brand", scopeValue: string) {
  const supabase = await createClient();
  if (!scopeValue) return [];
  let query = supabase
    .from("products")
    .select("id, sku, name, brand, attrs, sale_price, category:categories(id, name, icon, color)")
    .eq("active", true)
    .limit(500);
  if (scope === "supplier") query = query.eq("supplier_id", scopeValue);
  else if (scope === "category") query = query.eq("category_id", scopeValue);
  else query = query.eq("brand", scopeValue);
  const data = must(await query, "analysis/queries.loadPricingPreview.data") ?? [];
  const costById = await productCostMap(supabase, data.map((p) => p.id));
  return data.map((p) => ({ ...p, cost_price: costById.get(p.id) ?? null }));
}
