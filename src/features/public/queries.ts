import { PLANS } from "@/lib/plans";
import { createPublicClient } from "@/lib/supabase/public";
import { must } from "@/lib/supabase/must";

type PlanRow = {
  id: string; name: string; tagline: string | null; who: string | null;
  monthly_price: number | string; yearly_price: number | string | null;
  credits: number; limits: Record<string, unknown> | null; popular: boolean;
};

// O catálogo público tem 3 colunas fixas (FEATURE_MATRIX, tabela de IA,
// ROI por faixa de lojas), então a ordem e os ids vêm do PLANS estático e o
// banco sobrescreve o que o admin edita: nome, textos, preço, créditos,
// limites e destaque. Campos que só existem no estático (support, msgs,
// limits.history quando o banco não tem) ficam. Plano desativado no admin
// sai dos cards (active: false). Falha de leitura lança: as páginas são
// ISR, então o Next mantém a última versão boa em vez de publicar preço
// estático que pode não bater com o que o checkout cobra.
export async function loadPublicPlans() {
  const supabase = createPublicClient();
  const [plansRes, trialRes, packsRes] = await Promise.all([
    supabase.from("plans").select("id, name, tagline, who, monthly_price, yearly_price, credits, limits, popular"),
    supabase.rpc("fn_platform_trial_days"),
    supabase.from("credit_packs").select("id, credits, price").eq("active", true).order("credits"),
  ]);
  const rows = must(plansRes, "public.loadPublicPlans.plans");
  const trialDays = must(trialRes, "public.loadPublicPlans.trialDays");
  const packs = must(packsRes, "public.loadPublicPlans.creditPacks");

  const byId = new Map(((rows ?? []) as PlanRow[]).map((r) => [r.id, r]));
  const plans = PLANS.map((base) => {
    const row = byId.get(base.id);
    if (!row) return { ...base, active: false };
    return {
      ...base,
      name: row.name,
      tagline: row.tagline ?? base.tagline,
      who: row.who ?? base.who,
      monthly: Number(row.monthly_price),
      yearly: row.yearly_price != null ? Number(row.yearly_price) : Number(row.monthly_price) * 12,
      credits: row.credits,
      popular: row.popular,
      limits: { ...base.limits, ...(row.limits ?? {}) },
      active: true,
    };
  });

  const days = typeof trialDays === "number" ? trialDays : 14;
  const creditPacks = (packs ?? []).map((p) => ({ id: p.id as string, credits: p.credits as number, price: Number(p.price) }));
  return { plans, creditPacks, trialDays: days, trialEndsOn: new Date(Date.now() + days * 86400000).toISOString() };
}
