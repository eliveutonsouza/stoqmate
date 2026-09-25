import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { OPEN_ROUTES } from "@/lib/permissions";
import { gateStoreRoute, type SessionAccess } from "@/lib/access-gate";

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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Redirect leva junto os cookies que o getUser() acabou de renovar.
  const redirectTo = (path: string) => {
    const res = NextResponse.redirect(new URL(path, request.url));
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!user) {
    const loginPath = pathname.startsWith(ADMIN_PREFIX) ? "/login/admin" : "/login";
    return redirectTo(loginPath);
  }

  if (pathname.startsWith(ADMIN_PREFIX)) {
    const { data: isStaff } = await supabase.rpc("is_platform_staff");
    if (!isStaff) {
      return redirectTo("/login/admin");
    }
    return response;
  }

  if (NEEDS_SESSION.includes(pathname)) return response;

  // Perfil + assinatura valem aqui, não só no menu: digitar a URL não pula.
  const { data: ctxRows, error: ctxError } = await supabase.rpc("fn_session_context");
  if (ctxError) {
    return redirectTo("/error");
  }
  const ctx = (ctxRows as { role: string | null; access: SessionAccess }[] | null)?.[0];
  const access = ctx?.access ?? "no_tenant";
  if (access === "no_tenant") {
    const { data: isStaff } = await supabase.rpc("is_platform_staff");
    if (isStaff) return redirectTo(ADMIN_PREFIX);
  }
  const target = gateStoreRoute(pathname, { role: ctx?.role ?? null, access });
  if (target) {
    return redirectTo(target);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif)$).*)",
  ],
};
