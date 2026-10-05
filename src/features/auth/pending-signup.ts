import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { mfaLoginPath } from "@/lib/access-gate";

// "É staff?" pra decidir se a conta sem tenant precisa terminar cadastro.
// Não usa is_platform_staff(): ela exige 2FA (aal2), e logo após o login por
// senha o staff ainda está em aal1 — cairia em /complete-signup por engano.
export async function hasStaffRow(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.from("platform_staff").select("user_id").maybeSingle();
  if (error) throw new Error(`[auth.hasStaffRow] ${error.message}`);
  return Boolean(data);
}

// Usuário com fator TOTP verificado numa sessão que ainda é aal1 (só senha
// ou Google). Lê a sessão local, sem ida ao Auth server.
export async function needsMfa(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw new Error(`[auth.needsMfa] ${error.message}`);
  return data.nextLevel === "aal2" && data.currentLevel !== "aal2";
}

// Pra onde vai quem acabou de autenticar (senha ou link de email). Falha de
// leitura lança: antes o erro virava "sem tenant" e um lojista com loja
// configurada caía em /complete-signup por causa de uma queda de rede.
export async function postLoginDestination(supabase: SupabaseClient, user: User, next = "/dashboard"): Promise<string> {
  // Com 2FA pendente auth_tenant_id() é null por design — sem esse desvio a
  // conta configurada cairia em /complete-signup.
  if (await needsMfa(supabase)) return mfaLoginPath(next);
  const [tenantRes, isStaff] = await Promise.all([supabase.rpc("auth_tenant_id"), hasStaffRow(supabase)]);
  if (tenantRes.error) throw new Error(`[auth.postLoginDestination] ${tenantRes.error.message}`);
  if (tenantRes.data || isStaff) return next;
  return (await finishPendingSignup(supabase, user)) ?? "/complete-signup";
}

// Telefone do cadastro vai pro perfil (coluna liberada pro próprio usuário).
// Falha aqui não desfaz o cadastro — só registra.
export async function saveSignupPhone(supabase: SupabaseClient, phone: string | null | undefined) {
  if (!phone) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from("profiles").update({ phone }).eq("id", user.id);
  if (error) console.error("[auth.saveSignupPhone]", error.message);
}

export function slugify(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 30);
  return base || "loja";
}

// Com confirmação de email ligada, signUp não devolve sessão: o que o
// usuário digitou (loja/plano, ou o token do convite) viaja em
// user_metadata e só vira tenant/vínculo quando ele volta pelo link do
// email, em /auth/callback. Devolve o destino, ou null se não havia nada
// pendente (ex.: login com Google — segue pra /complete-signup).
export async function finishPendingSignup(supabase: SupabaseClient, user: User): Promise<string | null> {
  const meta = user.user_metadata ?? {};

  if (typeof meta.invite_token === "string") {
    const { error } = await supabase.rpc("fn_accept_invite", {
      p_token: meta.invite_token,
      p_full_name: meta.full_name || user.email?.split("@")[0] || "",
    });
    return error ? `/invite?token=${encodeURIComponent(meta.invite_token)}` : "/dashboard";
  }

  if (typeof meta.store_name === "string" && meta.store_name) {
    const { error } = await supabase.rpc("fn_complete_signup", {
      p_full_name: meta.full_name || "",
      p_store_name: meta.store_name,
      p_subdomain: slugify(meta.store_name),
      p_cnpj: meta.cnpj || null,
      p_plan_id: meta.plan_id || "controle",
    });
    if (!error) await saveSignupPhone(supabase, typeof meta.phone === "string" ? meta.phone : null);
    if (!error || error.message.includes("already has a tenant")) return "/onboarding";
    console.error("[auth.finishPendingSignup] fn_complete_signup", error.message);
  }

  return null;
}
