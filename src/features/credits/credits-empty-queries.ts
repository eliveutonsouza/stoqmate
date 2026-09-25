import { createClient, getTenantId } from "@/lib/supabase/server";
import { must } from "@/lib/supabase/must";

// /ai/credits-empty — saldo real (plano + extra), data de renovação da cota,
// custo de cada operação de IA e pacotes avulsos à venda.
export async function loadCreditsEmptyState() {
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);
  const [tenantRes, opsRes, packsRes, canBuyRes] = await Promise.all([
    supabase
      .from("tenants")
      .select("ai_credit_plan_balance, ai_credit_extra_balance, ai_credit_renews_at, plan:plans(name, credits)")
      .eq("id", tenantId)
      .single(),
    supabase.from("ai_ops").select("id, label, credits").order("credits"),
    supabase.from("credit_packs").select("id, credits, price").eq("active", true).order("credits"),
    supabase.rpc("has_access", { p_area: "billing", p_min_level: 2 }),
  ]);
  const tenant = must(tenantRes, "credits-empty.tenant") as {
    ai_credit_plan_balance: number; ai_credit_extra_balance: number; ai_credit_renews_at: string;
    plan: { name: string; credits: number } | { name: string; credits: number }[] | null;
  };
  const ops = must(opsRes, "credits-empty.ops") as { id: string; label: string; credits: number }[];
  const packs = must(packsRes, "credits-empty.packs") as { id: string; credits: number; price: number | string }[];
  const canBuy = Boolean(must(canBuyRes, "credits-empty.has_access"));
  const plan = Array.isArray(tenant.plan) ? tenant.plan[0] ?? null : tenant.plan;

  return {
    planName: plan?.name ?? null,
    planQuota: plan?.credits ?? null,
    planBalance: tenant.ai_credit_plan_balance,
    extraBalance: tenant.ai_credit_extra_balance,
    renewsAt: tenant.ai_credit_renews_at,
    ops,
    packs: packs.map((p) => ({ id: p.id, credits: p.credits, price: Number(p.price) })),
    canBuy,
  };
}
