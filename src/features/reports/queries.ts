import { createClient } from "@/lib/supabase/server";

export function last30Days() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export async function loadSalesReport() {
  const supabase = await createClient();
  const { start, end } = last30Days();
  const { data } = await supabase.rpc("fn_sales_report", { p_start: start.toISOString(), p_end: end.toISOString() });
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

export async function loadAttributeReport(categoryId: string) {
  const supabase = await createClient();
  const { start, end } = last30Days();
  const { data } = await supabase.rpc("fn_attribute_sales_report", {
    p_category_id: categoryId, p_start: start.toISOString(), p_end: end.toISOString(),
  });
  return data ?? {};
}

export async function loadAbcReport() {
  const supabase = await createClient();
  const { start, end } = last30Days();
  const { data } = await supabase.rpc("fn_abc_report", { p_start: start.toISOString(), p_end: end.toISOString() });
  return { range: { start, end }, rows: data ?? [] };
}

export async function loadMonthlyProfit() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("fn_monthly_profit", { p_months: 6 });
  return data ?? [];
}

export async function loadCategoriesWithAttributes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, code, icon, color, unit, unit_plural, category_attributes(id, key, label, type, position)")
    .order("name");
  return (data ?? []).map((c) => ({ ...c, category_attributes: [...(c.category_attributes || [])].sort((a, b) => a.position - b.position) }));
}
