import { createClient } from "@/lib/supabase/server";
import { loadStores } from "@/features/stock/queries";
import { resolveStoreId } from "@/features/shell/queries";
import { must } from "@/lib/supabase/must";

export async function loadOpenCashSession(storeId: string) {
  const supabase = await createClient();
  const session = must(await supabase
    .from("cash_sessions")
    .select("id, store_id, opening_amount, opened_at, created_by")
    .eq("store_id", storeId)
    .eq("status", "open")
    .maybeSingle(), "pos/queries.loadOpenCashSession.session");
  if (!session) return null;

  const [movementsRes, salesRes, paymentsRes] = await Promise.all([
    supabase
      .from("cash_session_movements")
      .select("id, kind, amount, note, created_at, created_by")
      .eq("session_id", session.id)
      .order("created_at"),
    supabase
      .from("sales")
      .select("id, total, discount_amount")
      .eq("store_id", storeId)
      .gte("created_at", session.opened_at),
    // Formas de pagamento das vendas do turno: venda dividida conta a parte
    // em dinheiro no dinheiro e o resto em "outros".
    supabase
      .from("payments")
      .select("document_id, method, amount")
      .eq("store_id", storeId).eq("document_type", "sale").eq("direction", "in")
      .gte("created_at", session.opened_at),
  ]);
  const movements = must(movementsRes, "pos/queries.loadOpenCashSession.movements");
  const sales = must(salesRes, "pos/queries.loadOpenCashSession.sales");
  const payments = must(paymentsRes, "pos/queries.loadOpenCashSession.payments") ?? [];
  const cashPayments = payments.filter((p) => p.method === "dinheiro");
  const otherPayments = payments.filter((p) => p.method !== "dinheiro");

  const userIds = Array.from(
    new Set([session.created_by, ...(movements ?? []).map((m) => m.created_by)].filter((id): id is string => Boolean(id))),
  );
  const profiles = userIds.length
    ? must(await supabase.from("profiles").select("id, full_name").in("id", userIds), "pos/queries.profiles")
    : [];
  const nameById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name || "Usuário"]));
  const salesSummary = {
    count: sales?.length ?? 0,
    total: (sales ?? []).reduce((s, sale) => s + sale.total, 0),
    discount: (sales ?? []).reduce((s, sale) => s + sale.discount_amount, 0),
    cashTotal: cashPayments.reduce((s, p) => s + Number(p.amount), 0),
    cashCount: new Set(cashPayments.map((p) => p.document_id)).size,
    otherTotal: otherPayments.reduce((s, p) => s + Number(p.amount), 0),
    otherCount: new Set(otherPayments.map((p) => p.document_id)).size,
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
  const sale = must(await supabase
    .from("sales")
    .select(`
      id, store_id, subtotal, discount_amount, total, payment_method, installments, notes, created_at,
      store:stores(id, name),
      customer:customers(id, name),
      sale_items(id, sku_snapshot, name_snapshot, variant_snapshot, qty, unit_price, discount_pct, total)
    `)
    .eq("id", saleId)
    .maybeSingle(), "pos/queries.loadSaleReceipt.sale");
  if (!sale) return null;
  // Formas registradas (várias quando a venda foi dividida).
  const payments = must(await supabase
    .from("payments")
    .select("method, amount, installments")
    .eq("document_type", "sale").eq("document_id", saleId).eq("direction", "in")
    .order("created_at"), "pos/queries.loadSaleReceipt.payments") ?? [];
  return { ...sale, payments };
}

export async function loadPosData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [storesRes, categoriesRes, productsRes, openSessionsRes, profileRes] = await Promise.all([
    supabase.from("stores").select("id, name").order("name"),
    supabase.from("categories").select("id, name, icon, color, code").order("name"),
    supabase
      .from("products")
      .select("id, sku, barcode, brand, name, attrs, sale_price, category:categories(id, name, icon, color, code), stock_balances(store_id, qty)")
      .eq("active", true)
      .order("name")
      .limit(60),
    supabase.from("cash_sessions").select("id, store_id").eq("status", "open"),
    user ? supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const stores = must(storesRes, "pos/queries.loadPosData.stores");
  const categories = must(categoriesRes, "pos/queries.loadPosData.categories");
  const products = must(productsRes, "pos/queries.loadPosData.products");
  const openSessions = must(openSessionsRes, "pos/queries.loadPosData.openSessions");
  const profile = must(profileRes, "pos/queries.loadPosData.profile");

  // Preço que o banco vai cobrar (promoção ativa), não só o de tabela.
  const ids = (products ?? []).map((p) => p.id);
  const prices = ids.length
    ? must(await supabase.rpc("fn_effective_prices", { p_product_ids: ids }), "pos/queries.loadPosData.effectivePrices")
    : [];
  const priceById = new Map(((prices ?? []) as { product_id: string; price: number; promotion_name: string | null }[])
    .map((r) => [r.product_id, r]));

  return {
    stores: stores ?? [],
    categories: categories ?? [],
    products: (products ?? []).map((p) => ({
      ...p,
      effective_price: Number(priceById.get(p.id)?.price ?? p.sale_price),
      promotion_name: priceById.get(p.id)?.promotion_name ?? null,
    })),
    cashSessionByStore: Object.fromEntries((openSessions ?? []).map((s) => [s.store_id, s.id])),
    operatorName: profile?.full_name || user?.email || "Operador",
  };
}

export async function loadCashScreen(requestedStore?: string) {
  const stores = await loadStores();
  const storeId = (await resolveStoreId(stores, requestedStore)) ?? '';
  const session = storeId ? await loadOpenCashSession(storeId) : null;
  return { stores, storeId, session };
}
