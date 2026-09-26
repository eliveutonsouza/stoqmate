import { must } from "@/lib/supabase/must";
import { createClient } from "@/lib/supabase/server";
import { loadSalesReport, last30Days } from "@/features/reports/queries";
import { loadLowStockItems } from "@/features/stock/queries";
import type { SalesReportJson } from "@/features/reports/queries";
import { movementCostMap } from "@/lib/supabase/costs";

// jsonb de fn_stock_overview.
type StockOverviewJson = { total_qty: number; sku_count: number; low_stock_count: number; total_cost_value: number; rupture_count: number };

export async function loadDashboardData() {
  const supabase = await createClient();
  const now = new Date();
  const { start } = last30Days();
  const prevEnd = start;
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - 30);

  const [salesReport, prevReportRes, overviewRes, storesRes, movementsRes, lowStockItems, balanceRes] = await Promise.all([
    loadSalesReport(),
    supabase.rpc("fn_sales_report", { p_start: prevStart.toISOString(), p_end: prevEnd.toISOString() }),
    supabase.rpc("fn_stock_overview"),
    supabase.from("stores").select("id, name").order("name"),
    supabase
      .from("stock_movements")
      .select(`
        id, kind, qty, unit_price, created_at, reason, created_by,
        product:products(id, sku, name, category:categories(id, name, icon, color)),
        store:stores(id, name)
      `)
      .order("created_at", { ascending: false })
      .limit(8),
    loadLowStockItems(6),
    supabase.rpc("fn_store_balance_totals"),
  ]);
  const prevReport = must(prevReportRes, "dashboard.prevReport") as SalesReportJson | null;
  const overview = must(overviewRes, "dashboard.overview") as StockOverviewJson | null;
  const stores = must(storesRes, "dashboard.stores");
  const movementRows = must(movementsRes, "dashboard.movements") ?? [];
  const movementCost = await movementCostMap(supabase, movementRows.map((m) => m.id));
  const movements = movementRows.map((m) => ({ ...m, unit_cost: movementCost.get(m.id) ?? null }));
  const balanceRows = must(balanceRes, "dashboard.balances") as { store_id: string; sku_count: number; qty: number }[] | null;

  const userIds = [...new Set((movements ?? []).map((m) => m.created_by).filter((id): id is string => Boolean(id)))];
  const profiles = userIds.length
    ? must(await supabase.from("profiles").select("id, full_name").in("id", userIds), "dashboard/queries.profiles")
    : [];
  const nameById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name || "Usuário"]));

  const pctDelta = (curr: number, prev: number) => (prev > 0 ? ((curr - prev) / prev) * 100 : null);
  const revenueDelta = pctDelta(salesReport.revenue, prevReport?.revenue ?? 0);
  const unitsDelta = pctDelta(salesReport.units, prevReport?.units ?? 0);
  const turnover = overview && overview.total_cost_value > 0 ? salesReport.cost / overview.total_cost_value : null;

  const categoriesActive = new Set((salesReport.byCategory ?? []).map((c: { category_id: string }) => c.category_id)).size;

  const balanceByStore = new Map(
    (balanceRows ?? []).map((row) => [row.store_id, { skuCount: Number(row.sku_count), qty: Number(row.qty) }]),
  );
  const storeBalances = (stores ?? []).map((s) => ({ ...s, ...(balanceByStore.get(s.id) ?? { skuCount: 0, qty: 0 }) }));

  return {
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
