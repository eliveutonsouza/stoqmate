"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authEmailOrigin } from "@/lib/site-origin";
import { hasStaffRow, postLoginDestination, saveSignupPhone, slugify } from "@/features/auth/pending-signup";
import { isInvalidCredentials, signInErrorMessage } from "@/lib/auth-errors";
import { GENERIC_ERROR, userMessage } from "@/lib/errors";
import { isEmail, passwordError, textError } from "@/lib/validation";

// Falha que não é credencial errada é incidente (chave inválida, rede) — vai
// pro log da Vercel em vez de sumir atrás de "senha incorreta".
function logAuthFailure(where: string, error: { name?: string; status?: number; code?: string; message?: string }) {
  if (isInvalidCredentials(error)) return;
  console.error(`[auth] ${where}`, { name: error.name, status: error.status, code: error.code, message: error.message });
}

function verifyEmailPath(email: string) {
  return `/verify-email?email=${encodeURIComponent(email)}`;
}

export async function signUpAction(input: {
  fullName: string;
  phone?: string;
  email: string;
  password: string;
  storeName: string;
  cnpj: string;
  planId: string;
  acceptedTerms: boolean;
}) {
  if (input.acceptedTerms !== true) return { error: "Aceite os termos de uso pra continuar." };
  const invalid = textError(input.fullName, "seu nome", 2, 120)
    ?? (isEmail(input.email) ? null : "Informe um email válido.")
    ?? passwordError(input.password)
    ?? textError(input.storeName, "o nome da loja", 2, 80)
    ?? (typeof input.planId === "string" && input.planId ? null : "Escolha um plano.");
  if (invalid) return { error: invalid };
  const email = input.email.trim();
  const phone = typeof input.phone === "string" ? input.phone.trim().slice(0, 30) : "";

  const supabase = await createClient();
  const origin = await authEmailOrigin();

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
      data: {
        full_name: input.fullName.trim(), phone: phone || null, store_name: input.storeName.trim(),
        cnpj: input.cnpj || null, plan_id: input.planId, terms_accepted_at: new Date().toISOString(),
      },
    },
  });

  if (signUpError) {
    const alreadyExists = signUpError.code === "user_already_exists" || signUpError.code === "email_exists";
    if (!alreadyExists) return { error: userMessage(signUpError, "auth/signUp") };
    // Pode ser um retry depois de uma falha no passo seguinte (o usuário já
    // foi criado no auth, mas fn_complete_signup não rodou até o fim) —
    // tenta logar com a senha informada antes de desistir.
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: input.password });
    if (signInError?.code === "email_not_confirmed") redirect(verifyEmailPath(email));
    if (signInError) return { error: "Este email já está cadastrado." };
  } else if (!data.session) {
    // Confirmação de email ligada: o tenant nasce em /auth/callback
    // (finishPendingSignup) quando o link do email for clicado.
    redirect(verifyEmailPath(email));
  }

  const { error: rpcError } = await supabase.rpc("fn_complete_signup", {
    p_full_name: input.fullName.trim(),
    p_store_name: input.storeName.trim(),
    p_subdomain: slugify(input.storeName),
    p_cnpj: input.cnpj || null,
    p_plan_id: input.planId,
  });
  if (rpcError) {
    if (rpcError.message.includes("already has a tenant")) {
      return { error: "Este email já tem uma loja configurada. Faça login." };
    }
    return { error: userMessage(rpcError, "auth/actions") };
  }
  await saveSignupPhone(supabase, phone);

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
    return { error: userMessage(error, "auth/actions") };
  }

  redirect("/onboarding");
}

export async function signInAction(input: { email: string; password: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(input);
  if (error?.code === "email_not_confirmed") redirect(verifyEmailPath(input.email));
  if (error) {
    logAuthFailure("signIn", error);
    return { error: signInErrorMessage(error) };
  }

  // O link de confirmação aberto em outro navegador não troca o code (PKCE)
  // e o cadastro pendente não fecha no callback — fecha aqui no 1º login.
  let destination: string;
  try {
    destination = await postLoginDestination(supabase, data.user);
  } catch (err) {
    console.error("[auth] signIn destino", err);
    return { error: GENERIC_ERROR };
  }
  redirect(destination);
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
  if (signInError) {
    logAuthFailure("signInAdmin", signInError);
    return { error: signInErrorMessage(signInError) };
  }

  let isStaff: boolean;
  try {
    isStaff = await hasStaffRow(supabase);
  } catch (err) {
    console.error("[auth] signInAdmin staff", err);
    await supabase.auth.signOut();
    return { error: GENERIC_ERROR };
  }
  if (!isStaff) {
    await supabase.auth.signOut();
    return { error: "Esta conta não tem acesso ao console da plataforma." };
  }

  const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
  if (factorsError) {
    console.error("[auth] signInAdmin listFactors", factorsError.message);
    await supabase.auth.signOut();
    return { error: "Não foi possível validar o 2FA agora. Tente de novo." };
  }
  const totp = factorsData?.totp?.[0];
  if (!totp) {
    await supabase.auth.signOut();
    return { error: "Nenhum fator de autenticação (2FA) cadastrado nesta conta." };
  }

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: totp.id });
  if (challengeError) {
    await supabase.auth.signOut();
    return { error: "Não foi possível validar o 2FA agora. Tente de novo." };
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: totp.id,
    challengeId: challenge.id,
    code: input.code,
  });
  if (verifyError) {
    // Sem signOut a sessão ficava viva em aal1 (só senha) depois do 2FA errado.
    await supabase.auth.signOut();
    return { error: "Código 2FA inválido." };
  }

  redirect("/admin");
}

export async function signOutAction(to: "/login" | "/login/admin" = "/login") {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(to === "/login/admin" ? "/login/admin" : "/login");
}

export async function forgotPasswordAction(input: { email: string }) {
  if (!isEmail(input.email)) return { error: "Informe um email válido." };
  const supabase = await createClient();
  const origin = await authEmailOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(input.email.trim(), {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  // Email inexistente não gera erro no Supabase, então responder sucesso não
  // vaza quem tem conta. Limite de envio e falha de infra, sim, aparecem.
  if (error) {
    if (error.status === 429) return { error: "Muitas tentativas. Espere um minuto e tente de novo." };
    console.error("[auth] resetPasswordForEmail", { status: error.status, code: error.code, message: error.message });
    return { error: GENERIC_ERROR };
  }
  return { ok: true };
}

export async function resetPasswordAction(input: { password: string }) {
  const invalid = passwordError(input.password);
  if (invalid) return { error: invalid };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: input.password });
  if (error) return { error: userMessage(error, "auth/actions") };
  await supabase.auth.signOut();
  return { ok: true };
}

export async function acceptInviteAction(input: {
  token: string;
  email: string;
  fullName: string;
  password: string;
}) {
  const invalid = textError(input.fullName, "seu nome", 2, 120)
    ?? (isEmail(input.email) ? null : "Informe um email válido.")
    ?? passwordError(input.password);
  if (invalid) return { error: invalid };
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
  if (signUpError) return { error: userMessage(signUpError, "auth/actions") };
  if (!data.session) redirect(verifyEmailPath(input.email));

  const { error: rpcError } = await supabase.rpc("fn_accept_invite", {
    p_token: input.token,
    p_full_name: input.fullName,
  });
  if (rpcError) return { error: "Convite inválido ou expirado." };

  redirect("/dashboard");
}
