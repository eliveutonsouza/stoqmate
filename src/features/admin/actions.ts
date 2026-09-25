"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { requireStaff } from "@/features/admin/queries";

function friendlyError(message: string) {
  const known: Record<string, string> = {
    "not authorized": "Seu usuário não tem acesso ao console da plataforma.",
    "informe o motivo do acesso": "Informe o motivo do acesso.",
    "rede não encontrada": "Rede não encontrada.",
    "sessão não encontrada": "Sessão de acesso não encontrada.",
  };
  for (const [key, friendly] of Object.entries(known)) {
    if (message.includes(key)) return friendly;
  }
  return message;
}

export async function startImpersonationAction(input: { tenantId: string; reason: string; ticketRef: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_start_impersonation", {
    p_tenant_id: input.tenantId, p_reason: input.reason, p_ticket_ref: input.ticketRef || null,
  });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/admin/stores/detail");
  return { sessionId: data as string };
}

export async function endImpersonationAction(sessionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_end_impersonation", { p_session_id: sessionId });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/admin/stores/detail");
  return { ok: true };
}

const STAFF_ROLES = ["super_admin", "suporte", "engenharia", "comercial"] as const;

export async function invitePlatformStaffAction(input: { email: string; name: string; role: string }) {
  const supabase = await requireStaff();
  if (!STAFF_ROLES.includes(input.role as (typeof STAFF_ROLES)[number])) {
    return { error: "Função inválida." };
  }

  const {
    data: { user: caller },
  } = await supabase.auth.getUser();
  const { data: callerStaff } = await supabase.from("platform_staff").select("role").eq("user_id", caller?.id).maybeSingle();
  if (callerStaff?.role !== "super_admin") {
    return { error: "Só um Super Admin pode convidar pessoas para a equipe." };
  }

  const admin = createServiceRoleClient();
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(input.email, {
    data: { full_name: input.name },
  });
  if (inviteErr) return { error: inviteErr.message };

  const { error: staffErr } = await admin.from("platform_staff").insert({ user_id: invited.user.id, role: input.role });
  if (staffErr) return { error: staffErr.message };

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function createTenantAction(input: {
  name: string; subdomain: string; cnpj: string; planId: string;
  legalName: string; segment: string; city: string; state: string;
  ownerName: string; ownerEmail: string;
}) {
  const supabase = await requireStaff();

  const admin = createServiceRoleClient();
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(input.ownerEmail, {
    data: { full_name: input.ownerName },
  });
  if (inviteErr) return { error: inviteErr.message };

  const { data: tenantId, error } = await supabase.rpc("fn_platform_create_tenant", {
    p_name: input.name, p_subdomain: input.subdomain, p_cnpj: input.cnpj || null, p_plan_id: input.planId,
    p_legal_name: input.legalName || null, p_segment: input.segment || null, p_city: input.city || null, p_state: input.state || null,
    p_owner_user_id: invited.user.id, p_owner_full_name: input.ownerName,
  });
  if (error) {
    // A criação do tenant falhou depois de já convidar o usuário — remove o
    // convite órfão pra não deixar uma conta sem rede nenhuma.
    await admin.auth.admin.deleteUser(invited.user.id);
    return { error: friendlyError(error.message) };
  }

  revalidatePath("/admin/stores");
  return { id: tenantId as string };
}

export async function updateTenantAction(input: {
  tenantId: string; name: string; cnpj: string; planId: string; status: string;
  legalName: string; segment: string; city: string; state: string;
}) {
  const supabase = await requireStaff();
  const { error } = await supabase.rpc("fn_platform_update_tenant", {
    p_tenant_id: input.tenantId, p_name: input.name, p_cnpj: input.cnpj || null, p_plan_id: input.planId, p_status: input.status,
    p_legal_name: input.legalName || null, p_segment: input.segment || null, p_city: input.city || null, p_state: input.state || null,
  });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/admin/stores");
  revalidatePath("/admin/stores/detail");
  return { ok: true };
}

export async function updatePlatformSettingsAction(input: {
  trialDays: number; aiSpendCeilingUsd: number; aiAlertPct: number;
}) {
  const supabase = await requireStaff();
  if (!Number.isInteger(input.trialDays) || input.trialDays < 1 || input.trialDays > 90) {
    return { error: "Duração do trial deve ficar entre 1 e 90 dias." };
  }
  if (!(input.aiSpendCeilingUsd >= 0)) return { error: "Teto de gasto inválido." };
  if (!Number.isInteger(input.aiAlertPct) || input.aiAlertPct < 1 || input.aiAlertPct > 100) {
    return { error: "Alerta deve ficar entre 1% e 100%." };
  }
  const { error } = await supabase.rpc("fn_platform_settings_update", {
    p_trial_days: input.trialDays, p_ai_spend_ceiling_usd: input.aiSpendCeilingUsd, p_ai_alert_pct: input.aiAlertPct,
  });
  if (error) return { error: friendlyError(error.message) };
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
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_platform_plan_upsert", {
    p_id: input.id, p_name: input.name, p_tagline: input.tagline, p_who: input.who,
    p_monthly_price: input.monthlyPrice, p_yearly_price: input.yearlyPrice,
    p_credits: input.credits, p_limits: input.limits, p_popular: input.popular, p_active: input.active,
  });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/admin/plans");
  revalidatePublicPlanPages();
  return { id: input.id };
}
