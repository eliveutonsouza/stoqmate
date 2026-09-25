import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { finishPendingSignup } from "@/features/auth/pending-signup";

// Troca o `code` do link de email (reset de senha) ou do OAuth do Google por
// uma sessão de verdade via cookies. Rota técnica, não uma tela — ver
// .spec/routing.md.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/dashboard";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\") ? rawNext : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // Sem isso a falha some: o usuário só volta pro /login. Foi assim que
      // uma anon key inválida em produção passou despercebida.
      console.error("[auth/callback] exchangeCodeForSession falhou", {
        name: error.name,
        status: error.status,
        code: error.code,
        message: error.message,
      });
    } else {
      // Sem tenant: ou é confirmação de email de um cadastro/convite (dados
      // em user_metadata, fechados aqui), ou é login com Google, que não
      // coleta loja/CNPJ/plano e fecha o cadastro em /complete-signup.
      // Staff da plataforma também não tem tenant, e aí isso não se aplica.
      const [{ data: tenantId }, { data: isStaff }, { data: { user } }] = await Promise.all([
        supabase.rpc("auth_tenant_id"),
        supabase.rpc("is_platform_staff"),
        supabase.auth.getUser(),
      ]);
      if (!tenantId && !isStaff) {
        const pending = user ? await finishPendingSignup(supabase, user) : null;
        return NextResponse.redirect(`${origin}${pending ?? "/complete-signup"}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  } else {
    console.error("[auth/callback] chamado sem code", {
      error: searchParams.get("error"),
      errorCode: searchParams.get("error_code"),
    });
  }

  return NextResponse.redirect(`${origin}/login`);
}
