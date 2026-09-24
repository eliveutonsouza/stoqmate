import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";

// "É staff?" pra decidir se a conta sem tenant precisa terminar cadastro.
// Não usa is_platform_staff(): ela exige 2FA (aal2), e logo após o login por
// senha o staff ainda está em aal1 — cairia em /complete-signup por engano.
export async function hasStaffRow(supabase: SupabaseClient): Promise<boolean> {
  const { data } = await supabase.from("platform_staff").select("user_id").maybeSingle();
  return Boolean(data);
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
    if (!error || error.message.includes("already has a tenant")) return "/onboarding";
  }

  return null;
}
