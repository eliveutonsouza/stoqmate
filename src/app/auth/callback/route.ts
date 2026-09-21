import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      // Quem entra pelo Google chega sem tenant (o OAuth não coleta loja/CNPJ/
      // plano) e precisa fechar o cadastro antes de qualquer tela de loja.
      // Staff da plataforma também não tem tenant, e aí isso não se aplica.
      const [{ data: tenantId }, { data: isStaff }] = await Promise.all([
        supabase.rpc("auth_tenant_id"),
        supabase.rpc("is_platform_staff"),
      ]);
      if (!tenantId && !isStaff) {
        return NextResponse.redirect(`${origin}/complete-signup`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
