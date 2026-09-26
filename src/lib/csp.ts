// Content-Security-Policy montada no proxy.
//
// Duas variantes, porque nonce exige render dinâmico (o Next injeta o nonce
// nos próprios <script> ao renderizar a página):
// - app autenticado (loja + admin): já é todo dinâmico → script-src só com
//   nonce + 'strict-dynamic'. Script injetado por XSS não roda.
// - rotas públicas (landing, planos, termos, login…): são estáticas/ISR,
//   o HTML sai pronto sem nonce → script-src 'self' 'unsafe-inline'.
//   Proteção menor, mas nessas telas não há dado de sessão pra roubar.
//
// style-src leva 'unsafe-inline' nas duas: a UI inteira usa style={{…}}
// (atributo style), que nonce não cobre. Origens externas reais do app:
// Supabase (API, auth, storage) e Google Fonts (design-system.css).

export function buildCsp(opts: { nonce?: string; supabaseUrl: string; dev: boolean; https: boolean }) {
  const supabase = opts.supabaseUrl.replace(/\/+$/, "");
  const supabaseWs = supabase.replace(/^http/, "ws");
  const script = opts.nonce
    ? `'self' 'nonce-${opts.nonce}' 'strict-dynamic'`
    : `'self' 'unsafe-inline'`;
  const directives = [
    `default-src 'self'`,
    `script-src ${script}${opts.dev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `img-src 'self' data: blob: ${supabase}`,
    `connect-src 'self' ${supabase} ${supabaseWs}`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ];
  // Em http://localhost o upgrade trocaria os próprios assets por https.
  if (opts.https) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

export function createNonce() {
  return btoa(crypto.randomUUID());
}
