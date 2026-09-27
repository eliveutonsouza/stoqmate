"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { requireStaff } from "@/features/admin/queries";
import { userMessage, type DbErrorLike } from "@/lib/errors";
import { formatCnpj, isCnpj, isEmail, isUuid, textError } from "@/lib/validation";
import type { Database } from "@/lib/supabase/database.types";

type PlatformRole = Database["public"]["Enums"]["platform_role"];
const NO_ACCESS = "Seu usuário não tem acesso a essa ação do console.";

// requireStaff lança (é o gate das páginas); em action, lançar vira erro
// genérico na tela. Aqui devolve null e a action responde com texto.
// `roles` confere o papel antes de efeitos fora do banco (convite por email).
async function staffClient(roles?: PlatformRole[]) {
  try {
    const supabase = await requireStaff();
    if (roles) {
      const { data, error } = await supabase.rpc("has_platform_role", { p_roles: roles });
      if (error || !data) return null;
    }
    return supabase;
  } catch {
    return null;
  }
}

function friendlyError(error: DbErrorLike) {
  const message = error?.message ?? "";
  const known: Record<string, string> = {
    "not authorized": "Seu usuário não tem acesso ao console da plataforma.",
    "informe o motivo do acesso": "Informe o motivo do acesso.",
    "rede não encontrada": "Rede não encontrada.",
    "sessão não encontrada": "Sessão de acesso não encontrada.",
  };
  for (const [key, friendly] of Object.entries(known)) {
    if (message.includes(key)) return friendly;
  }
  return userMessage(error, "admin/actions");
}

export async function startImpersonationAction(input: { tenantId: string; reason: string; ticketRef: string }) {
  if (!isUuid(input.tenantId)) return { error: "Rede não encontrada." };
  const reasonError = textError(input.reason, "o motivo do acesso", 5, 300);
  if (reasonError) return { error: reasonError };
  if ((input.ticketRef?.length ?? 0) > 80) return { error: "Referência do chamado longa demais." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_start_impersonation", {
    p_tenant_id: input.tenantId, p_reason: input.reason.trim(), p_ticket_ref: input.ticketRef?.trim() || null,
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/admin/stores/detail");
  return { sessionId: data as string };
}

export async function endImpersonationAction(sessionId: string) {
  if (!isUuid(sessionId)) return { error: "Sessão de acesso não encontrada." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_end_impersonation", { p_session_id: sessionId });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/admin/stores/detail");
  return { ok: true };
}

const STAFF_ROLES = ["super_admin", "suporte", "engenharia", "comercial"] as const;

export async function invitePlatformStaffAction(input: { email: string; name: string; role: string }) {
  if (!STAFF_ROLES.includes(input.role as (typeof STAFF_ROLES)[number])) {
    return { error: "Função inválida." };
  }
  if (!isEmail(input.email)) return { error: "Email inválido." };
  const nameError = textError(input.name, "o nome", 2, 120);
  if (nameError) return { error: nameError };
  if (!(await staffClient(["super_admin"]))) {
    return { error: "Só um Super Admin pode convidar pessoas para a equipe." };
  }

  const admin = createServiceRoleClient();
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(input.email.trim().toLowerCase(), {
    data: { full_name: input.name.trim() },
  });
  if (inviteErr) return { error: userMessage(inviteErr, "admin/actions") };

  const { error: staffErr } = await admin.from("platform_staff").insert({ user_id: invited.user.id, role: input.role as (typeof STAFF_ROLES)[number] });
  if (staffErr) {
    // Sem a linha de staff o convite vira conta solta — desfaz.
    const { error: cleanupErr } = await admin.auth.admin.deleteUser(invited.user.id);
    if (cleanupErr) console.error("[admin/invite] limpeza do convite falhou", invited.user.id, cleanupErr.message);
    return { error: userMessage(staffErr, "admin/actions") };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function createTenantAction(input: {
  name: string; subdomain: string; cnpj: string; planId: string;
  legalName: string; segment: string; city: string; state: string;
  ownerName: string; ownerEmail: string;
}) {
  // Papel antes do convite: o convite manda email e cria usuário no Auth.
  const supabase = await staffClient(["super_admin", "suporte"]);
  if (!supabase) return { error: NO_ACCESS };
  if (typeof input.planId !== "string" || !/^[a-z0-9_-]{2,40}$/.test(input.planId)) return { error: "Plano inválido." };
  // Valida antes do convite: o convite dispara email e cria usuário no Auth.
  const invalid = textError(input.name, "o nome da rede", 2, 120)
    ?? (/^[a-z0-9][a-z0-9-]{1,40}$/.test(input.subdomain ?? "") ? null : "Subdomínio: só letras minúsculas, números e hífen.")
    ?? (input.cnpj?.trim() && !isCnpj(input.cnpj) ? "CNPJ inválido — confira os 14 dígitos." : null)
    ?? textError(input.ownerName, "o nome do responsável", 2, 120)
    ?? (isEmail(input.ownerEmail) ? null : "Informe um email válido pro responsável.");
  if (invalid) return { error: invalid };

  const admin = createServiceRoleClient();
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(input.ownerEmail.trim().toLowerCase(), {
    data: { full_name: input.ownerName.trim() },
  });
  if (inviteErr) return { error: userMessage(inviteErr, "admin/actions") };

  const { data: tenantId, error } = await supabase.rpc("fn_platform_create_tenant", {
    p_name: input.name.trim(), p_subdomain: input.subdomain, p_cnpj: input.cnpj?.trim() ? formatCnpj(input.cnpj) : null, p_plan_id: input.planId,
    p_legal_name: input.legalName || null, p_segment: input.segment || null, p_city: input.city || null, p_state: input.state || null,
    p_owner_user_id: invited.user.id, p_owner_full_name: input.ownerName,
  });
  if (error) {
    // A criação do tenant falhou depois de já convidar o usuário — remove o
    // convite órfão pra não deixar uma conta sem rede nenhuma.
    const { error: cleanupErr } = await admin.auth.admin.deleteUser(invited.user.id);
    if (cleanupErr) console.error("[admin/createTenant] limpeza do convite falhou", invited.user.id, cleanupErr.message);
    return { error: friendlyError(error) };
  }

  revalidatePath("/admin/stores");
  return { id: tenantId as string };
}

export async function updateTenantAction(input: {
  tenantId: string; name: string; cnpj: string; planId: string; status: string;
  legalName: string; segment: string; city: string; state: string;
}) {
  const supabase = await staffClient(["super_admin", "suporte"]);
  if (!supabase) return { error: NO_ACCESS };
  if (!isUuid(input.tenantId)) return { error: "Rede não encontrada." };
  const invalid = textError(input.name, "o nome da rede", 2, 120)
    ?? (input.cnpj?.trim() && !isCnpj(input.cnpj) ? "CNPJ inválido — confira os 14 dígitos." : null);
  if (invalid) return { error: invalid };
  // Plano de rede com assinatura ativa é o do Stripe: trocar só aqui divergia
  // da cobrança e o próximo webhook desfazia.
  const admin = createServiceRoleClient();
  const [{ data: current, error: currentErr }, { count: liveSubs, error: subsErr }] = await Promise.all([
    admin.from("tenants").select("plan_id").eq("id", input.tenantId).maybeSingle(),
    admin.from("subscriptions").select("id", { count: "exact", head: true }).eq("tenant_id", input.tenantId).neq("status", "canceled"),
  ]);
  // Sem saber se há assinatura, não dá pra decidir se a troca de plano é segura.
  if (currentErr || subsErr) return { error: userMessage(currentErr ?? subsErr, "admin/updateTenant.read") };
  if (!current) return { error: "Rede não encontrada." };
  if (current.plan_id !== input.planId && (liveSubs ?? 0) > 0) {
    return { error: "Esta rede tem assinatura no Stripe — a troca de plano é feita pela assinatura (portal do cliente), não aqui." };
  }
  const { error } = await supabase.rpc("fn_platform_update_tenant", {
    p_tenant_id: input.tenantId, p_name: input.name.trim(), p_cnpj: input.cnpj?.trim() ? formatCnpj(input.cnpj) : null, p_plan_id: input.planId, p_status: input.status,
    p_legal_name: input.legalName || null, p_segment: input.segment || null, p_city: input.city || null, p_state: input.state || null,
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/admin/stores");
  revalidatePath("/admin/stores/detail");
  return { ok: true };
}

export async function updatePlatformSettingsAction(input: {
  trialDays: number; trialAiCredits: number; aiSpendCeilingUsd: number; aiAlertPct: number;
}) {
  const supabase = await staffClient(["super_admin"]);
  if (!supabase) return { error: NO_ACCESS };
  if (!Number.isInteger(input.trialDays) || input.trialDays < 1 || input.trialDays > 90) {
    return { error: "Duração do trial deve ficar entre 1 e 90 dias." };
  }
  if (!Number.isInteger(input.trialAiCredits) || input.trialAiCredits < 0 || input.trialAiCredits > 100_000) {
    return { error: "Créditos de IA do trial: número inteiro entre 0 e 100.000." };
  }
  if (!(input.aiSpendCeilingUsd >= 0 && input.aiSpendCeilingUsd <= 1_000_000)) return { error: "Teto de gasto inválido." };
  if (!Number.isInteger(input.aiAlertPct) || input.aiAlertPct < 1 || input.aiAlertPct > 100) {
    return { error: "Alerta deve ficar entre 1% e 100%." };
  }
  const { error } = await supabase.rpc("fn_platform_settings_update", {
    p_trial_days: input.trialDays, p_trial_ai_credits: input.trialAiCredits,
    p_ai_spend_ceiling_usd: input.aiSpendCeilingUsd, p_ai_alert_pct: input.aiAlertPct,
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/admin/settings");
  revalidatePublicPlanPages();
  return { ok: true };
}

// Landing, /pricing e /signup são ISR (revalidate = 300) e mostram preço,
// créditos, limites e duração do trial — sem isso a edição no admin levaria
// até 5 min pra aparecer.
function revalidatePublicPlanPages() {
  revalidatePath("/");
  revalidatePath("/pricing");
  revalidatePath("/signup");
}

export async function upsertPlanAction(input: {
  id: string; name: string; tagline: string; who: string; monthlyPrice: number; yearlyPrice: number | null;
  credits: number; limits: Record<string, number | string | null>; popular: boolean; active: boolean;
}) {
  const supabase = await staffClient(["super_admin"]);
  if (!supabase) return { error: NO_ACCESS };
  if (!input.limits || typeof input.limits !== "object" || Array.isArray(input.limits)) return { error: "Limites inválidos." };
  if ((input.tagline?.length ?? 0) > 200 || (input.who?.length ?? 0) > 200) return { error: "Texto do plano longo demais." };
  if (!/^[a-z0-9_-]{2,40}$/.test(input.id ?? "")) return { error: "Identificador do plano inválido (use letras minúsculas, números, - ou _)." };
  if (!(input.monthlyPrice >= 0) || (input.yearlyPrice != null && !(input.yearlyPrice >= 0))) return { error: "Preço não pode ser negativo." };
  if (!Number.isInteger(input.credits) || input.credits < 0) return { error: "Créditos de IA precisam ser um número inteiro ≥ 0." };
  const nameError = textError(input.name, "o nome do plano", 2, 60);
  if (nameError) return { error: nameError };
  const { error } = await supabase.rpc("fn_platform_plan_upsert", {
    p_id: input.id, p_name: input.name, p_tagline: input.tagline, p_who: input.who,
    p_monthly_price: input.monthlyPrice, p_yearly_price: input.yearlyPrice,
    p_credits: input.credits, p_limits: input.limits, p_popular: input.popular, p_active: input.active,
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/admin/plans");
  revalidatePublicPlanPages();
  return { id: input.id };
}
