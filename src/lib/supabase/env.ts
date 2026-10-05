// Valida as envs públicas do Supabase antes de criar qualquer client. Sem
// isso, uma chave vazia ou colada com espaço/quebra de linha só aparece como
// 401 silencioso no gateway do Supabase (que nem registra no log) — foi o
// que derrubou o login em produção. A mensagem cita o NOME da variável,
// nunca o valor.
export type SupabaseEnv = { url: string; anonKey: string };

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function parseSupabaseEnv(rawUrl: string | undefined, rawKey: string | undefined): SupabaseEnv {
  const url = rawUrl?.trim() ?? "";
  const anonKey = rawKey?.trim() ?? "";
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL não está definida.");
  if (!anonKey) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida.");

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não é uma URL válida.");
  }
  const secure = parsed.protocol === "https:" || (parsed.protocol === "http:" && isLocalHost(parsed.hostname));
  if (!secure) throw new Error("NEXT_PUBLIC_SUPABASE_URL precisa usar https.");

  return { url, anonKey };
}

// Cookie de sessão do Supabase com Secure em produção (o padrão do
// @supabase/ssr não marca). httpOnly fica false: o client do navegador lê a
// sessão do cookie.
export const AUTH_COOKIE_OPTIONS = { secure: process.env.NODE_ENV === "production" };

// Acesso literal a process.env.NEXT_PUBLIC_*: é o que o Next substitui no
// build, inclusive no bundle do cliente. Não trocar por process.env[nome].
export function supabaseEnv(): SupabaseEnv {
  return parseSupabaseEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
