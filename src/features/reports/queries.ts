import { createClient } from "@/lib/supabase/server";
import { must } from "@/lib/supabase/must";
import { type RawSearchParams, param, uuidParam } from "@/lib/list-params";
import { type ReportRange, resolveReportRange, todayInSaoPaulo } from "@/lib/report-range";

// Mesmo "últimos 30 dias" dos relatórios (dias de calendário em São Paulo).
// Antes era 31 dias no fuso do servidor: a visão geral dizia "27 ago" e o
// relatório de vendas, "28 ago", pro mesmo período.
export function last30Days() {
  const range = resolveReportRange({ period: "30d" }, todayInSaoPaulo());
  return { start: new Date(range.startIso), end: new Date(new Date(range.endIso).getTime() - 1) };
}

// Filtros comuns dos relatórios, lidos da URL:
// ?period=7d|30d|90d|month|last-month|custom&from=YYYY-MM-DD&to=YYYY-MM-DD&store=<uuid>
export type ReportFilters = { range: ReportRange; storeId: string | null };

export function reportFiltersFromParams(sp: RawSearchParams): ReportFilters {
  return {
    range: resolveReportRange({ period: param(sp, "period"), from: param(sp, "from"), to: param(sp, "to") }, todayInSaoPaulo()),
    storeId: uuidParam(sp, "store"),
  };
}

function rangeArgs(filters?: ReportFilters) {
  if (filters) return { p_start: filters.range.startIso, p_end: filters.range.endIso, p_store_id: filters.storeId };
  const { start, end } = last30Days();
  return { p_start: start.toISOString(), p_end: end.toISOString() };
}

export async function loadReportStores() {
  const supabase = await createClient();
  return must(await supabase.from("stores").select("id, name").order("name"), "loadReportStores") ?? [];
}

// Forma do jsonb de fn_sales_report (20260924230100_report_store_filter.sql).
type Row = { [key: string]: unknown };
export type SalesReportJson = {
  revenue: number; cost: number; sale_count: number; units: number;
  daily_series: ({ date: string; revenue: number } & Row)[];
  by_store: ({ store_id: string; revenue: number } & Row)[];
  by_category: ({ category_id: string } & Row)[];
  by_product: ({ sku: string; name: string; category_name: string; units: number; cost: number; revenue: number } & Row)[];
};

// Sem `filters`: últimos 30 dias da rede inteira (dashboard e rede usam assim).
export async function loadSalesReport(filters?: ReportFilters) {
  const supabase = await createClient();
  const { start, end } = last30Days();
  const data = must(await supabase.rpc("fn_sales_report", rangeArgs(filters)), "loadSalesReport") as SalesReportJson | null;
  return {
    range: { start, end },
    revenue: data?.revenue ?? 0,
    cost: data?.cost ?? 0,
    saleCount: data?.sale_count ?? 0,
    units: data?.units ?? 0,
    dailySeries: data?.daily_series ?? [],
    byStore: data?.by_store ?? [],
    byCategory: data?.by_category ?? [],
    byProduct: data?.by_product ?? [],
  };
}

export async function loadAttributeReport(categoryId: string, filters?: ReportFilters) {
  const supabase = await createClient();
  const data = must(
    await supabase.rpc("fn_attribute_sales_report", { p_category_id: categoryId, ...rangeArgs(filters) }),
    "loadAttributeReport",
  );
  return data ?? {};
}

export async function loadAbcReport(filters?: ReportFilters) {
  const supabase = await createClient();
  const data = must(await supabase.rpc("fn_abc_report", rangeArgs(filters)), "loadAbcReport");
  return { rows: data ?? [] };
}

export async function loadMonthlyProfit(storeId: string | null = null) {
  const supabase = await createClient();
  const data = must(await supabase.rpc("fn_monthly_profit", { p_months: 6, p_store_id: storeId }), "loadMonthlyProfit");
  return data ?? [];
}

export async function loadCategoriesWithAttributes() {
  const supabase = await createClient();
  const data = must(
    await supabase
      .from("categories")
      .select("id, name, code, icon, color, unit, unit_plural, category_attributes(id, key, label, type, position)")
      .order("name"),
    "loadCategoriesWithAttributes",
  );
  return (data ?? []).map((c) => ({ ...c, category_attributes: [...(c.category_attributes || [])].sort((a, b) => a.position - b.position) }));
}

// Tela de atributos: categoria vem da URL (?category=), senão a primeira.
export async function loadAttributeReportPage(sp: RawSearchParams) {
  const filters = reportFiltersFromParams(sp);
  const [categories, stores] = await Promise.all([loadCategoriesWithAttributes(), loadReportStores()]);
  const requested = uuidParam(sp, "category");
  const categoryId = categories.find((c) => c.id === requested)?.id ?? categories[0]?.id ?? "";
  const data = categoryId ? await loadAttributeReport(categoryId, filters) : {};
  return { filters, stores, categories, categoryId, data };
}
