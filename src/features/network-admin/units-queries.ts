import { createClient } from "@/lib/supabase/server";
import { must } from "@/lib/supabase/must";

export async function loadNetworkUnits() {
  const supabase = await createClient();
  const [storesRes, totalsRes, membershipsRes, tenantRes, overviewRes] = await Promise.all([
    supabase.from("stores").select("id, name, type, city, created_at").order("created_at"),
    supabase.rpc("fn_store_balance_totals"),
    supabase.from("store_users").select("user_id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("tenants").select("plan_id, plan:plans(name, limits)").single(),
    supabase.rpc("fn_stock_overview"),
  ]);
  const stores = must(storesRes, "units.stores");
  const totals = must(totalsRes, "units.totals") as { store_id: string; sku_count: number; qty: number }[] | null;
  must(membershipsRes, "units.memberships");
  const tenant = must(tenantRes, "units.tenant");
  const overview = must(overviewRes, "units.overview") as { total_qty?: number } | null;

  const totalsByStore = new Map((totals ?? []).map((t) => [t.store_id, t]));
  // store_users hoje não referencia loja específica (equipe é por tenant, não por unidade) —
  // por isso "usuários" mostra o total do tenant em cada linha, não é bug, é o modelo atual.
  const totalUsers = membershipsRes.count ?? 0;

  const units = (stores ?? []).map((s) => ({
    ...s,
    skus: Number(totalsByStore.get(s.id)?.sku_count ?? 0),
    items: Number(totalsByStore.get(s.id)?.qty ?? 0),
    users: totalUsers,
  }));

  const plan = Array.isArray(tenant?.plan) ? tenant.plan[0] : tenant?.plan;
  const storeLimit = plan?.limits?.stores ?? null;
  const storeCount = units.filter((u) => u.type === "loja").length;

  return {
    units,
    totalItems: Number(overview?.total_qty ?? units.reduce((s, u) => s + u.items, 0)),
    totalSkus: await countStockedProducts(supabase),
    planName: plan?.name ?? "—",
    storeLimit,
    storeCount,
  };
}

// Produtos com saldo > 0 em pelo menos uma loja (distinto na rede).
async function countStockedProducts(supabase: Awaited<ReturnType<typeof createClient>>) {
  const res = await supabase
    .from("products")
    .select("id, stock_balances!inner(qty)", { count: "exact", head: true })
    .gt("stock_balances.qty", 0);
  must(res, "units.stockedProducts");
  return res.count ?? 0;
}
