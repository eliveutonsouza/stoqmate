import { createClient } from "@/lib/supabase/server";

export async function loadNetworkUnits() {
  const supabase = await createClient();
  const [{ data: stores }, { data: balances }, { data: memberships }, { data: tenant }] = await Promise.all([
    supabase.from("stores").select("id, name, type, city, created_at").order("created_at"),
    supabase.from("stock_balances").select("store_id, product_id, qty"),
    supabase.from("store_users").select("store_id"),
    supabase.from("tenants").select("plan_id, plan:plans(name, limits)").single(),
  ]);

  const skusByStore = new Map<string, Set<string>>();
  const itemsByStore = new Map<string, number>();
  for (const b of balances ?? []) {
    if (b.qty > 0) {
      const set = skusByStore.get(b.store_id) ?? new Set<string>();
      set.add(b.product_id);
      skusByStore.set(b.store_id, set);
    }
    itemsByStore.set(b.store_id, (itemsByStore.get(b.store_id) ?? 0) + b.qty);
  }
  // store_users hoje não referencia loja específica (equipe é por tenant, não por unidade) —
  // por isso "usuários" mostra o total do tenant em cada linha, não é bug, é o modelo atual.
  const totalUsers = memberships?.length ?? 0;

  const units = (stores ?? []).map((s) => ({
    ...s,
    skus: skusByStore.get(s.id)?.size ?? 0,
    items: itemsByStore.get(s.id) ?? 0,
    users: totalUsers,
  }));

  const plan = Array.isArray(tenant?.plan) ? tenant.plan[0] : tenant?.plan;
  const storeLimit = plan?.limits?.stores ?? null;
  const storeCount = units.filter((u) => u.type === "loja").length;

  return {
    units,
    totalItems: units.reduce((s, u) => s + u.items, 0),
    totalSkus: new Set((balances ?? []).filter((b) => b.qty > 0).map((b) => b.product_id)).size,
    planName: plan?.name ?? "—",
    storeLimit,
    storeCount,
  };
}
