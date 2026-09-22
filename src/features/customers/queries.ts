import { createClient } from "@/lib/supabase/server";

export async function loadFirstRunStatus() {
  const supabase = await createClient();
  const [
    { count: categoryCount }, { count: productCount }, { count: supplierCount },
    { count: locationCount }, { count: teamCount }, { count: cashSessionCount },
  ] = await Promise.all([
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("suppliers").select("id", { count: "exact", head: true }),
    supabase.from("locations").select("id", { count: "exact", head: true }),
    supabase.from("store_users").select("id", { count: "exact", head: true }),
    supabase.from("cash_sessions").select("id", { count: "exact", head: true }),
  ]);
  return {
    hasCategories: (categoryCount ?? 0) > 0,
    hasProducts: (productCount ?? 0) > 0,
    hasSuppliers: (supplierCount ?? 0) > 0,
    hasLocations: (locationCount ?? 0) > 0,
    hasTeam: (teamCount ?? 0) > 1,
    hasCashSession: (cashSessionCount ?? 0) > 0,
  };
}

export async function loadCustomers() {
  const supabase = await createClient();
  const [{ data: customers }, { data: stats }] = await Promise.all([
    supabase.from("customers").select("id, name, doc, phone, email, credit_balance, created_at").order("name"),
    supabase.from("customer_stats").select("customer_id, purchases_count, total_spent, last_purchase_at"),
  ]);
  const statsById = Object.fromEntries((stats ?? []).map((s) => [s.customer_id, s]));
  return (customers ?? []).map((c) => ({
    ...c,
    purchases_count: statsById[c.id]?.purchases_count ?? 0,
    total_spent: statsById[c.id]?.total_spent ?? 0,
    last_purchase_at: statsById[c.id]?.last_purchase_at ?? null,
  }));
}

export async function loadCustomerDetail(customerId: string) {
  const supabase = await createClient();
  const [{ data: customer }, { data: sales }, { data: ledger }] = await Promise.all([
    supabase.from("customers").select("id, name, doc, phone, email, notes, credit_balance, created_at").eq("id", customerId).maybeSingle(),
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
