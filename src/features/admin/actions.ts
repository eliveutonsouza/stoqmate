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

export async function invitePlatformStaffAction(input: { email: string; name: string; role: string }) {
  await requireStaff();
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
  return { id: input.id };
}
