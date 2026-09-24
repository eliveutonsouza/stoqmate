"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authEmailOrigin } from "@/lib/site-origin";
import { finishPendingSignup, slugify } from "@/features/auth/pending-signup";

function verifyEmailPath(email: string) {
  return `/verify-email?email=${encodeURIComponent(email)}`;
}

export async function signUpAction(input: {
  fullName: string;
  email: string;
  password: string;
  storeName: string;
  cnpj: string;
  planId: string;
}) {
  const supabase = await createClient();
  const origin = await authEmailOrigin();

  const { data, error: signUpError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
      data: { full_name: input.fullName, store_name: input.storeName, cnpj: input.cnpj || null, plan_id: input.planId },
    },
  });

  if (signUpError) {
    // Pode ser um retry depois de uma falha no passo seguinte (o usuário já
    // foi criado no auth, mas fn_complete_signup não rodou até o fim) —
    // tenta logar com a senha informada antes de desistir.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (signInError?.code === "email_not_confirmed") redirect(verifyEmailPath(input.email));
    if (signInError) return { error: "Este email já está cadastrado." };
  } else if (!data.session) {
    // Confirmação de email ligada: o tenant nasce em /auth/callback
    // (finishPendingSignup) quando o link do email for clicado.
    redirect(verifyEmailPath(input.email));
  }

  const { error: rpcError } = await supabase.rpc("fn_complete_signup", {
    p_full_name: input.fullName,
    p_store_name: input.storeName,
    p_subdomain: slugify(input.storeName),
    p_cnpj: input.cnpj || null,
    p_plan_id: input.planId,
  });
  if (rpcError) {
    if (rpcError.message.includes("already has a tenant")) {
      return { error: "Este email já tem uma loja configurada. Faça login." };
    }
    return { error: rpcError.message };
  }

  redirect("/onboarding");
}

export async function startGoogleSignInAction() {
  const supabase = await createClient();
  const origin = await authEmailOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data?.url) return { error: "Não foi possível iniciar o login com Google." };
  return { url: data.url };
}

// O login com Google entrega só um usuário autenticado — nome da loja, CNPJ e
// plano não existem nesse fluxo, então o tenant ainda não foi criado.
// `/auth/callback` manda pra cá quem chega sem tenant; aqui o cadastro fecha.
export async function completeGoogleSignupAction(input: {
  storeName: string;
  cnpj: string;
  planId: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre de novo." };

  const meta = user.user_metadata ?? {};
  const fullName = meta.full_name || meta.name || user.email?.split("@")[0] || "";

  const { error } = await supabase.rpc("fn_complete_signup", {
    p_full_name: fullName,
    p_store_name: input.storeName,
    p_subdomain: slugify(input.storeName),
    p_cnpj: input.cnpj || null,
    p_plan_id: input.planId,
  });
  if (error) {
    if (error.message.includes("already has a tenant")) redirect("/dashboard");
    return { error: error.message };
  }

  redirect("/onboarding");
}

export async function signInAction(input: { email: string; password: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(input);
  if (error?.code === "email_not_confirmed") redirect(verifyEmailPath(input.email));
  if (error) return { error: "Email ou senha incorretos." };

  // O link de confirmação aberto em outro navegador não troca o code (PKCE)
  // e o cadastro pendente não fecha no callback — fecha aqui no 1º login.
  const [{ data: tenantId }, { data: isStaff }] = await Promise.all([
    supabase.rpc("auth_tenant_id"),
    supabase.rpc("is_platform_staff"),
  ]);
  if (!tenantId && !isStaff) {
    redirect((await finishPendingSignup(supabase, data.user)) ?? "/complete-signup");
  }
  redirect("/dashboard");
}

export async function resendConfirmationAction(input: { email: string }) {
  const supabase = await createClient();
  const origin = await authEmailOrigin();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: input.email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/onboarding` },
  });
  if (error) {
    if (error.status === 429) return { error: "Muitas tentativas. Espere um minuto e tente de novo." };
    return { error: "Não foi possível reenviar agora. Tente de novo em instantes." };
  }
  return { ok: true };
}

export async function signInAdminAction(input: { email: string; password: string; code: string }) {
  const supabase = await createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (signInError) return { error: "Email ou senha incorretos." };

  const { data: staffRow } = await supabase.from("platform_staff").select("user_id").maybeSingle();
  if (!staffRow) {
    await supabase.auth.signOut();
    return { error: "Esta conta não tem acesso ao console da plataforma." };
  }

  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  const totp = factorsData?.totp?.[0];
  if (!totp) {
    await supabase.auth.signOut();
    return { error: "Nenhum fator de autenticação (2FA) cadastrado nesta conta." };
  }

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: totp.id });
  if (challengeError) return { error: challengeError.message };

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: totp.id,
    challengeId: challenge.id,
    code: input.code,
  });
  if (verifyError) return { error: "Código 2FA inválido." };

  redirect("/admin");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(input: { email: string }) {
  const supabase = await createClient();
  const origin = await authEmailOrigin();
  await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  // Sempre retorna sucesso, mesmo se o email não existir — não vaza quem tem conta.
  return { ok: true };
}

export async function resetPasswordAction(input: { password: string }) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: input.password });
  if (error) return { error: error.message };
  await supabase.auth.signOut();
  return { ok: true };
}

export async function acceptInviteAction(input: {
  token: string;
  email: string;
  fullName: string;
  password: string;
}) {
  const supabase = await createClient();
  const origin = await authEmailOrigin();

  // O link de convite é compartilhado à mão, não prova posse do email — com
  // confirmação ligada, o vínculo só acontece em /auth/callback.
  const { data, error: signUpError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
      data: { full_name: input.fullName, invite_token: input.token },
    },
  });
  if (signUpError) return { error: signUpError.message };
  if (!data.session) redirect(verifyEmailPath(input.email));

  const { error: rpcError } = await supabase.rpc("fn_accept_invite", {
    p_token: input.token,
    p_full_name: input.fullName,
  });
  if (rpcError) return { error: "Convite inválido ou expirado." };

  redirect("/dashboard");
}
