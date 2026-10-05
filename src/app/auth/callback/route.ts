import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { postLoginDestination } from "@/features/auth/pending-signup";
import { safeNext } from "@/lib/safe-next";

// Troca o `code` do link de email (reset de senha) ou do OAuth do Google por
// uma sessão de verdade via cookies. Rota técnica, não uma tela — ver
// .spec/routing.md.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          return NextResponse.redirect(`${origin}${await postLoginDestination(supabase, user, next)}`);
        } catch (err) {
          // Sessão já existe; a leitura de tenant falhou. Manda pro destino e
          // deixa o proxy decidir — cair em /complete-signup seria errado.
          console.error("[auth/callback] destino pós-login", err);
          return NextResponse.redirect(`${origin}${next}`);
        }
      }
    }
  } else {
    console.error("[auth/callback] chamado sem code", {
      error: searchParams.get("error"),
      errorCode: searchParams.get("error_code"),
    });
  }

  return NextResponse.redirect(`${origin}/login`);
}
