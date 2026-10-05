// Content-Security-Policy montada no proxy.
//
// Duas variantes, porque nonce exige render dinâmico (o Next injeta o nonce
// nos próprios <script> ao renderizar a página):
// - app autenticado (loja + admin): já é todo dinâmico → script-src só com
//   nonce + 'strict-dynamic'. Script injetado por XSS não roda.
// - telas públicas de credencial (login, login admin, reset de senha,
//   convite, esqueci a senha): dinâmicas, mesmo nonce do app.
// - demais rotas públicas (landing, planos, termos, cadastro): estáticas/ISR,
//   o HTML sai pronto sem nonce → script-src 'self' 'unsafe-inline'.
//
// style-src leva 'unsafe-inline' nas duas: a UI inteira usa style={{…}}
// (atributo style), que nonce não cobre. Origens externas reais do app:
// Supabase (API, auth, storage — inclusive os vídeos da central de ajuda).
// Fontes são self-hosted pelo next/font.

export function buildCsp(opts: { nonce?: string; supabaseUrl: string; dev: boolean; https: boolean }) {
  const supabase = opts.supabaseUrl.replace(/\/+$/, "");
  const supabaseWs = supabase.replace(/^http/, "ws");
  const script = opts.nonce
    ? `'self' 'nonce-${opts.nonce}' 'strict-dynamic'`
    : `'self' 'unsafe-inline'`;
  const directives = [
    `default-src 'self'`,
    `script-src ${script}${opts.dev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `font-src 'self' data:`,
    `img-src 'self' data: blob: ${supabase}`,
    // Vídeos e legendas da central de ajuda (bucket público help-media).
    `media-src 'self' blob: ${supabase}`,
    `connect-src 'self' ${supabase} ${supabaseWs}`,
    // Player dos vídeos da central de ajuda (domínio sem cookies do YouTube).
    `frame-src https://www.youtube-nocookie.com`,
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
