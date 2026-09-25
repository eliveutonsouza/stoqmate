import { must } from "@/lib/supabase/must";
import { createClient, getTenantId } from "@/lib/supabase/server";

type Limits = { skus?: number | null; users?: number | null; stores?: number | null };
type PlanRow = { id: string; name: string; monthly_price: number | string; limits: Limits | null };

export async function loadPlanUsage() {
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);

  const [tenantRes, plansRes, skusRes, storesRes, membersRes, invitesRes] = await Promise.all([
    supabase.from("tenants").select("plan_id").eq("id", tenantId).maybeSingle(),
    supabase.from("plans").select("id, name, monthly_price, limits").eq("active", true).order("monthly_price"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("active", true),
    supabase.from("stores").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("type", "loja"),
    supabase.rpc("fn_team_members"),
    supabase.rpc("fn_team_pending_invites"),
  ]);
  const tenant = must(tenantRes, "credits.loadPlanUsage.tenant");
  const plans = must(plansRes, "credits.loadPlanUsage.plans");
  must(skusRes, "credits.loadPlanUsage.skus");
  const skus = skusRes.count;
  must(storesRes, "credits.loadPlanUsage.stores");
  const stores = storesRes.count;
  const members = must(membersRes, "credits.loadPlanUsage.members");
  const invites = must(invitesRes, "credits.loadPlanUsage.invites");

  const allPlans = (plans ?? []) as PlanRow[];
  const current = allPlans.find((p) => p.id === tenant?.plan_id) ?? null;
  const currentPrice = Number(current?.monthly_price ?? 0);

  // Próximo plano = o mais barato acima do atual cujo limite daquele eixo é
  // maior (ou ilimitado).
  const upgradeFor = (kind: keyof Limits) => {
    const now = current?.limits?.[kind] ?? null;
    if (now == null) return null;
    const next = allPlans.find((p) => Number(p.monthly_price) > currentPrice && (p.limits?.[kind] == null || Number(p.limits[kind]) > now));
    return next ? { name: next.name, limit: next.limits?.[kind] ?? null } : null;
  };

  return {
    planName: current?.name ?? "—",
    limits: {
      skus: current?.limits?.skus ?? null,
      users: current?.limits?.users ?? null,
      stores: current?.limits?.stores ?? null,
    },
    usage: {
      skus: skus ?? 0,
      stores: stores ?? 0,
      users: members ? members.length + (invites?.length ?? 0) : null,
    },
    upgrade: { skus: upgradeFor("skus"), users: upgradeFor("users"), stores: upgradeFor("stores") },
  };
}
