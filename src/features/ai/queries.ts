import { createClient } from "@/lib/supabase/server";
import { must } from "@/lib/supabase/must";

export async function loadCreditPacks() {
  const supabase = await createClient();
  const data = must(await supabase.from("credit_packs").select("id, credits, price").eq("active", true).order("credits"), "ai/queries.loadCreditPacks.data");
  return data ?? [];
}

export async function loadAiQuota() {
  const supabase = await createClient();
  const [tenantRes, opsRes] = await Promise.all([
    supabase
      .from("tenants")
      .select("plan_id, ai_credit_plan_balance, ai_credit_extra_balance, ai_credit_renews_at, plan:plans(name, credits)")
      .single(),
    supabase.from("ai_ops").select("id, label, credits"),
  ]);
  const tenant = must(tenantRes, "ai/queries.loadAiQuota.tenant");
  const ops = must(opsRes, "ai/queries.loadAiQuota.ops");
  if (!tenant) return null;

  const plan = tenant.plan as unknown as { name: string; credits: number } | null;
  const renewsAt = new Date(tenant.ai_credit_renews_at as string);
  const cycleStart = new Date(renewsAt);
  cycleStart.setMonth(cycleStart.getMonth() - 1);

  const usage = must(await supabase
    .from("ai_usage_log")
    .select("op_id")
    .eq("status", "ok")
    .gte("created_at", cycleStart.toISOString()), "ai/queries.loadAiQuota.usage");

  const opById = Object.fromEntries((ops ?? []).map((o) => [o.id, o]));

  const runsByOp = new Map<string, number>();
  for (const row of usage ?? []) {
    runsByOp.set(row.op_id, (runsByOp.get(row.op_id) ?? 0) + 1);
  }

  const byFeature = [...runsByOp.entries()]
    .map(([opId, runs]) => {
      const op = opById[opId];
      if (!op) return null;
      return { id: opId, label: op.label as string, runs, credits: op.credits as number, used: runs * (op.credits as number) };
    })
    .filter((x): x is { id: string; label: string; runs: number; credits: number; used: number } => x !== null)
    .sort((a, b) => b.used - a.used);

  const planCredits = plan?.credits ?? 0;
  const planBalance = tenant.ai_credit_plan_balance as number;
  const extraBalance = tenant.ai_credit_extra_balance as number;

  return {
    planId: tenant.plan_id as string,
    planName: plan?.name ?? tenant.plan_id,
    planCredits,
    planUsed: Math.max(0, planCredits - planBalance),
    planBalance,
    extraBalance,
    renewsAt: tenant.ai_credit_renews_at as string,
    byFeature,
    costs: Object.fromEntries((ops ?? []).map((o) => [o.id, o.credits as number])) as Record<string, number>,
  };
}
