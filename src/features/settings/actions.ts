"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { limitKindFromError } from "@/lib/plan-limits";

export async function inviteTeamMemberAction(input: {
  email: string;
  fullName: string;
  role: string;
}) {
  const supabase = await createClient();
  const { data: token, error } = await supabase.rpc("fn_team_invite", {
    p_email: input.email,
    p_full_name: input.fullName,
    p_role: input.role,
  });
  if (error) {
    const limit = limitKindFromError(error.message);
    if (limit) redirect(`/limit-reached?kind=${limit}`);
    return { error: error.message };
  }

  revalidatePath("/settings/users");
  return { ok: true, token: token as string };
}

export async function setTeamRoleAction(userId: string, role: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_team_set_role", { p_user_id: userId, p_role: role });
  if (error) return { error: error.message };

  revalidatePath("/settings/users");
  return { ok: true };
}

export async function removeTeamMemberAction(userId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_team_remove", { p_user_id: userId });
  if (error) return { error: error.message };

  revalidatePath("/settings/users");
  return { ok: true };
}

export async function cancelInviteAction(inviteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_team_cancel_invite", { p_invite_id: inviteId });
  if (error) return { error: error.message };

  revalidatePath("/settings/users");
  return { ok: true };
}

export async function updateFiscalModeAction(mode: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_update_fiscal_mode", { p_mode: mode });
  if (error) {
    if (error.message.includes("not authorized")) return { error: "Seu perfil não tem permissão para mudar a configuração fiscal." };
    return { error: error.message };
  }
  revalidatePath("/settings/fiscal");
  return { ok: true };
}

export async function updateCompanyDataAction(input: { name: string; cnpj: string }) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_update_company_data", { p_name: input.name, p_cnpj: input.cnpj });
  if (error) {
    if (error.message.includes("not authorized")) return { error: "Seu perfil não tem permissão para mudar os dados da empresa." };
    return { error: error.message };
  }
  revalidatePath("/settings/store-data");
  return { ok: true };
}

export async function requestAccountDeletionAction() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_request_account_deletion");
  if (error) {
    if (error.message.includes("not authorized")) return { error: "Só o proprietário pode excluir a conta." };
    return { error: error.message };
  }
  await supabase.auth.signOut();
  return { ok: true };
}

export async function updateBrandingAction(input: { logoUrl: string | null; brandColor: string }) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_update_branding", { p_logo_url: input.logoUrl, p_brand_color: input.brandColor });
  if (error) {
    if (error.message.includes("not authorized")) return { error: "Seu perfil não tem permissão para mudar o branding." };
    return { error: error.message };
  }
  revalidatePath("/settings/branding");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function uploadBrandingLogoAction(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Nenhum arquivo enviado." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };
  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).maybeSingle();
  if (!profile?.tenant_id) return { error: "Sem rede associada a esta sessão." };

  const path = `${profile.tenant_id}/${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("store-branding").upload(path, file);
  if (error) return { error: error.message };
  const { data } = supabase.storage.from("store-branding").getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function updateProfileAction(input: { fullName: string; phone: string; avatarUrl: string | null }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: input.fullName, phone: input.phone || null, avatar_url: input.avatarUrl })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function changePasswordAction(input: { currentPassword: string; newPassword: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Sessão expirada." };
  if (input.newPassword.length < 8) return { error: "A nova senha precisa ter pelo menos 8 caracteres." };

  const { error: checkError } = await supabase.auth.signInWithPassword({ email: user.email, password: input.currentPassword });
  if (checkError) return { error: "Senha atual incorreta." };

  const { error } = await supabase.auth.updateUser({ password: input.newPassword });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function enrollMfaAction() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
  if (error) return { error: error.message };
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

export async function verifyMfaAction(input: { factorId: string; code: string }) {
  const supabase = await createClient();
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: input.factorId });
  if (challengeError) return { error: challengeError.message };
  const { error } = await supabase.auth.mfa.verify({ factorId: input.factorId, challengeId: challenge.id, code: input.code });
  if (error) return { error: "Código inválido." };
  revalidatePath("/profile");
  return { ok: true };
}

export async function unenrollMfaAction(factorId: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { ok: true };
}

export async function uploadAvatarAction(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Nenhum arquivo enviado." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file);
  if (error) return { error: error.message };

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return { url: data.publicUrl };
}
