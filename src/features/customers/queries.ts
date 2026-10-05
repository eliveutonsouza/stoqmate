import { createClient } from "@/lib/supabase/server";
import { must } from "@/lib/supabase/must";
import { type RawSearchParams, PAGE_SIZE, pageParam, pageRange, param } from "@/lib/list-params";

export async function loadFirstRunStatus() {
  const supabase = await createClient();
  const results = await Promise.all([
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("suppliers").select("id", { count: "exact", head: true }),
    supabase.from("locations").select("id", { count: "exact", head: true }),
    supabase.from("store_users").select("id", { count: "exact", head: true }),
    supabase.from("cash_sessions").select("id", { count: "exact", head: true }),
  ]);
  // Erro de leitura não pode virar "passo pendente" (o checklist mandaria
  // cadastrar o que já existe) — sobe pro error boundary.
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(`[customers/queries.loadFirstRunStatus] ${failed.error.message}`);
  const [
    { count: categoryCount }, { count: productCount }, { count: supplierCount },
    { count: locationCount }, { count: teamCount }, { count: cashSessionCount },
  ] = results;
  return {
    hasCategories: (categoryCount ?? 0) > 0,
    hasProducts: (productCount ?? 0) > 0,
    hasSuppliers: (supplierCount ?? 0) > 0,
    hasLocations: (locationCount ?? 0) > 0,
    hasTeam: (teamCount ?? 0) > 1,
    hasCashSession: (cashSessionCount ?? 0) > 0,
  };
}

// Lista de clientes (/customers): busca (?q) em nome/documento/telefone/
// email, filtro ?credit=1 (com crédito em loja) e ?page — no servidor via
// fn_customers_list. KPIs somam a base inteira, não a página.
export async function loadCustomers(sp: RawSearchParams) {
  const filters = { q: param(sp, "q"), credit: param(sp, "credit") === "1", page: pageParam(sp) };
  const { offset, limit } = pageRange(filters.page);
  const supabase = await createClient();
  const data = must(
    await supabase.rpc("fn_customers_list", { p_term: filters.q, p_with_credit: filters.credit, p_limit: limit, p_offset: offset }),
    "loadCustomers",
  );
  return {
    filters,
    pageSize: PAGE_SIZE,
    rows: data?.rows ?? [],
    total: Number(data?.total ?? 0),
    stats: {
      customerCount: Number(data?.catalog_total ?? 0),
      totalSpent: Number(data?.total_spent ?? 0),
      creditTotal: Number(data?.credit_total ?? 0),
      creditCount: Number(data?.credit_count ?? 0),
    },
  };
}

export async function loadCustomerDetail(customerId: string) {
  const supabase = await createClient();
  const [customerRes, salesRes, ledgerRes] = await Promise.all([
    supabase.from("customers").select("id, name, doc, phone, email, notes, credit_balance, created_at, anonymized_at").eq("id", customerId).maybeSingle(),
    supabase
      .from("sales")
      .select("id, created_at, total, store:stores(id, name), sale_items(id, name_snapshot, qty)")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),
    supabase
      .from("customer_credit_ledger")
      .select("id, delta, balance_after, reason, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),
  ]);
  const customer = must(customerRes, "customers/queries.loadCustomerDetail.customer");
  const sales = must(salesRes, "customers/queries.loadCustomerDetail.sales");
  const ledger = must(ledgerRes, "customers/queries.loadCustomerDetail.ledger");
  if (!customer) return null;

  const productCounts = new Map<string, number>();
  for (const sale of sales ?? []) {
    for (const item of sale.sale_items ?? []) {
      productCounts.set(item.name_snapshot, (productCounts.get(item.name_snapshot) ?? 0) + item.qty);
    }
  }
  const topProducts = [...productCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name, qty }));

  return { customer, sales: sales ?? [], ledger: ledger ?? [], topProducts };
}
