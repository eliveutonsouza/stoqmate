import { createClient } from "@/lib/supabase/server";

export async function loadAiQuota() {
  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("plan_id, ai_credit_plan_balance, ai_credit_extra_balance, ai_credit_renews_at, plan:plans(name, credits)")
    .single();
  if (!tenant) return null;

  const plan = tenant.plan as unknown as { name: string; credits: number } | null;
  const renewsAt = new Date(tenant.ai_credit_renews_at as string);
  const cycleStart = new Date(renewsAt);
  cycleStart.setMonth(cycleStart.getMonth() - 1);

  const { data: usage } = await supabase
    .from("ai_usage_log")
    .select("op_id")
    .eq("status", "ok")
    .gte("created_at", cycleStart.toISOString());

  const { data: ops } = await supabase.from("ai_ops").select("id, label, credits");
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
  };
}
