import { createClient } from "@/lib/supabase/server";
import { loadSalesReport, last30Days } from "@/features/reports/queries";
import { loadLowStockItems } from "@/features/stock/queries";

export async function loadDashboardData() {
  const supabase = await createClient();
  const now = new Date();
  const { start } = last30Days();
  const prevEnd = start;
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - 30);

  const [salesReport, { data: prevReport }, { data: overview }, { data: stores }, { data: movements }, lowStockItems, { data: balanceRows }] = await Promise.all([
    loadSalesReport(),
    supabase.rpc("fn_sales_report", { p_start: prevStart.toISOString(), p_end: prevEnd.toISOString() }),
    supabase.rpc("fn_stock_overview"),
    supabase.from("stores").select("id, name").order("name"),
    supabase
      .from("stock_movements")
      .select(`
        id, kind, qty, unit_cost, unit_price, created_at, reason, created_by,
        product:products(id, sku, name, category:categories(id, name, icon, color)),
        store:stores(id, name)
      `)
      .order("created_at", { ascending: false })
      .limit(8),
    loadLowStockItems(6),
    supabase.from("stock_balances").select("store_id, qty"),
  ]);

  const userIds = [...new Set((movements ?? []).map((m) => m.created_by).filter(Boolean))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };
  const nameById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name || "Usuário"]));

  const pctDelta = (curr: number, prev: number) => (prev > 0 ? ((curr - prev) / prev) * 100 : null);
  const revenueDelta = pctDelta(salesReport.revenue, prevReport?.revenue ?? 0);
  const unitsDelta = pctDelta(salesReport.units, prevReport?.units ?? 0);
  const turnover = overview?.total_cost_value > 0 ? salesReport.cost / overview.total_cost_value : null;

  const categoriesActive = new Set((salesReport.byCategory ?? []).map((c: { category_id: string }) => c.category_id)).size;

  const balanceByStore = new Map<string, { skuCount: number; qty: number }>();
  for (const row of balanceRows ?? []) {
    const entry = balanceByStore.get(row.store_id) ?? { skuCount: 0, qty: 0 };
    if (row.qty > 0) entry.skuCount += 1;
    entry.qty += row.qty;
    balanceByStore.set(row.store_id, entry);
  }
  const storeBalances = (stores ?? []).map((s) => ({ ...s, ...(balanceByStore.get(s.id) ?? { skuCount: 0, qty: 0 }) }));

  return {
    storeName: stores?.[0]?.name ?? "Rede",
    storeCount: stores?.length ?? 0,
    date: now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }),
    metrics: {
      revenue: salesReport.revenue,
      revenueDelta,
      saleCount: salesReport.saleCount,
      revenueSpark: (salesReport.dailySeries ?? []).slice(-14).map((d: { revenue: number }) => d.revenue),
      units: salesReport.units,
      unitsDelta,
      totalQty: overview?.total_qty ?? 0,
      skuCount: overview?.sku_count ?? 0,
      categoriesActive,
      turnover,
    },
    salesSeries: (salesReport.dailySeries ?? []).map((d: { date: string; revenue: number }) => ({
      d: new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      v: d.revenue,
    })),
    byCategory: salesReport.byCategory ?? [],
    topProducts: (salesReport.byProduct ?? []).slice(0, 6),
    lowStockCount: overview?.low_stock_count ?? 0,
    lowStockItems,
    stores: stores ?? [],
    storeBalances,
    movements: (movements ?? []).map((m) => ({ ...m, byName: nameById[m.created_by ?? ""] || "Usuário" })),
  };
}
