import { createClient } from "@/lib/supabase/server";

export async function loadOpenCashSession(storeId: string) {
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("cash_sessions")
    .select("id, store_id, opening_amount, opened_at, created_by")
    .eq("store_id", storeId)
    .eq("status", "open")
    .maybeSingle();
  if (!session) return null;

  const [{ data: movements }, { data: sales }] = await Promise.all([
    supabase
      .from("cash_session_movements")
      .select("id, kind, amount, note, created_at, created_by")
      .eq("session_id", session.id)
      .order("created_at"),
    supabase
      .from("sales")
      .select("id, total, discount_amount, payment_method")
      .eq("store_id", storeId)
      .gte("created_at", session.opened_at),
  ]);

  const userIds = Array.from(
    new Set([session.created_by, ...(movements ?? []).map((m) => m.created_by)].filter(Boolean)),
  );
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };
  const nameById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name || "Usuário"]));
  const salesSummary = {
    count: sales?.length ?? 0,
    total: (sales ?? []).reduce((s, sale) => s + sale.total, 0),
    discount: (sales ?? []).reduce((s, sale) => s + sale.discount_amount, 0),
    cashTotal: (sales ?? []).filter((s) => s.payment_method === "dinheiro").reduce((s, sale) => s + sale.total, 0),
    cashCount: (sales ?? []).filter((s) => s.payment_method === "dinheiro").length,
    otherTotal: (sales ?? []).filter((s) => s.payment_method !== "dinheiro").reduce((s, sale) => s + sale.total, 0),
    otherCount: (sales ?? []).filter((s) => s.payment_method !== "dinheiro").length,
  };

  return {
    ...session,
    operatorName: nameById[session.created_by ?? ""] || "Usuário",
    movements: (movements ?? []).map((m) => ({ ...m, byName: nameById[m.created_by ?? ""] || "Usuário" })),
    salesSummary,
  };
}

export async function loadSaleReceipt(saleId: string) {
  const supabase = await createClient();
  const { data: sale } = await supabase
    .from("sales")
    .select(`
      id, store_id, subtotal, discount_amount, total, payment_method, installments, notes, created_at,
      store:stores(id, name),
      customer:customers(id, name),
      sale_items(id, sku_snapshot, name_snapshot, variant_snapshot, qty, unit_price, discount_pct, total)
    `)
    .eq("id", saleId)
    .maybeSingle();
  return sale ?? null;
}

export async function loadPosData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: stores }, { data: categories }, { data: products }, { data: openSessions }, { data: profile }] = await Promise.all([
    supabase.from("stores").select("id, name").order("name"),
    supabase.from("categories").select("id, name, icon, color, code").order("name"),
    supabase
      .from("products")
      .select("id, sku, brand, name, attrs, sale_price, cost_price, category:categories(id, name, icon, color, code), stock_balances(store_id, qty)")
      .order("name")
      .limit(60),
    supabase.from("cash_sessions").select("id, store_id").eq("status", "open"),
    user ? supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  return {
    stores: stores ?? [],
    categories: categories ?? [],
    products: products ?? [],
    cashSessionByStore: Object.fromEntries((openSessions ?? []).map((s) => [s.store_id, s.id])),
    operatorName: profile?.full_name || user?.email || "Operador",
  };
}
