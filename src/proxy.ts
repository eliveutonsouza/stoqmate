import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { OPEN_ROUTES } from "@/lib/permissions";
import { gateStoreRoute, type SessionAccess } from "@/lib/access-gate";
import { supabaseEnv } from "@/lib/supabase/env";
import { buildCsp, createNonce } from "@/lib/csp";

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

  const { url, anonKey } = supabaseEnv();
  const cspBase = { supabaseUrl: url, dev: process.env.NODE_ENV === "development", https: request.nextUrl.protocol === "https:" };

  if (isPublic) {
    const res = NextResponse.next();
    res.headers.set("Content-Security-Policy", buildCsp(cspBase));
    return res;
  }

  // App autenticado: nonce por request. O Next lê o nonce do header CSP da
  // REQUISIÇÃO e aplica nos próprios <script>; o da resposta é o que o
  // navegador faz valer.
  const csp = buildCsp({ ...cspBase, nonce: createNonce() });
  const next = () => {
    const headers = new Headers(request.headers);
    headers.set("Content-Security-Policy", csp);
    const res = NextResponse.next({ request: { headers } });
    res.headers.set("Content-Security-Policy", csp);
    return res;
  };

  let response = next();

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
          response = next();
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
    // Deep link: quem abre /products/detail?id=… deslogado volta pra lá
    // depois de entrar (login lê ?next=; admin sempre cai no console).
    if (pathname.startsWith(ADMIN_PREFIX)) return redirectTo("/login/admin");
    const next = pathname + request.nextUrl.search;
    return redirectTo(next === "/dashboard" ? "/login" : `/login?next=${encodeURIComponent(next)}`);
  }

  if (pathname.startsWith(ADMIN_PREFIX)) {
    const { data: isStaff, error: staffError } = await supabase.rpc("is_platform_staff");
    // Falha de leitura ≠ "não é staff": mandar pro login faria o admin
    // achar que a senha/2FA caiu. Continua fechado, mas mostra erro.
    if (staffError) return redirectTo("/error");
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
    const { data: isStaff, error: staffError } = await supabase.rpc("is_platform_staff");
    if (staffError) return redirectTo("/error");
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
