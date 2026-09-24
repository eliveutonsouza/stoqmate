import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { finishPendingSignup, hasStaffRow } from "@/features/auth/pending-signup";

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
    if (!error) {
      // Sem tenant: ou é confirmação de email de um cadastro/convite (dados
      // em user_metadata, fechados aqui), ou é login com Google, que não
      // coleta loja/CNPJ/plano e fecha o cadastro em /complete-signup.
      // Staff da plataforma também não tem tenant, e aí isso não se aplica.
      const [{ data: tenantId }, isStaff, { data: { user } }] = await Promise.all([
        supabase.rpc("auth_tenant_id"),
        hasStaffRow(supabase),
        supabase.auth.getUser(),
      ]);
      if (!tenantId && !isStaff) {
        const pending = user ? await finishPendingSignup(supabase, user) : null;
        return NextResponse.redirect(`${origin}${pending ?? "/complete-signup"}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
