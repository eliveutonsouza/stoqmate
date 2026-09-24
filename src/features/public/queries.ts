import { PLANS } from "@/lib/plans";
import { createPublicClient } from "@/lib/supabase/public";

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
// sai dos cards (active: false). Se o banco falhar, a página cai pro
// estático em vez de quebrar.
export async function loadPublicPlans() {
  const supabase = createPublicClient();
  const [{ data: rows, error }, { data: trialDays }] = await Promise.all([
    supabase.from("plans").select("id, name, tagline, who, monthly_price, yearly_price, credits, limits, popular"),
    supabase.rpc("fn_platform_trial_days"),
  ]);

  const byId = new Map(((rows ?? []) as PlanRow[]).map((r) => [r.id, r]));
  const plans = PLANS.map((base) => {
    if (error) return { ...base, active: true };
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
  return { plans, trialDays: days, trialEndsOn: new Date(Date.now() + days * 86400000).toISOString() };
}
