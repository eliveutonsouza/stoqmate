import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { OPEN_ROUTES } from "@/lib/permissions";
import { supabaseEnv } from "@/lib/supabase/env";

// Rotas públicas são exatamente OPEN_ROUTES do RBAC (marketing + auth +
// system) — mesma fonte que o cliente já usa em can()/areaFor(), não uma
// segunda lista pra ficar dessincronizada. /login/admin fica de fora de
// propósito: é pública pra CARREGAR a tela, mas o console em si (/admin/**)
// exige platform_staff, checado abaixo.
const ADMIN_PREFIX = "/admin";

// Aberta no RBAC (nenhum perfil é barrado) mas exige sessão: é onde quem
// entrou pelo Google termina o cadastro, e sem usuário logado não há o que
// completar. Por isso sai da lista de bypass mesmo estando em OPEN_ROUTES.
const NEEDS_SESSION = ["/complete-signup"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    (OPEN_ROUTES.includes(pathname) && !NEEDS_SESSION.includes(pathname)) ||
    pathname === "/login/admin" ||
    pathname.startsWith("/auth/callback");

  if (isPublic) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = supabaseEnv();

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginPath = pathname.startsWith(ADMIN_PREFIX) ? "/login/admin" : "/login";
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  if (pathname.startsWith(ADMIN_PREFIX)) {
    const { data: isStaff } = await supabase.rpc("is_platform_staff");
    if (!isStaff) {
      return NextResponse.redirect(new URL("/login/admin", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif)$).*)",
  ],
};
