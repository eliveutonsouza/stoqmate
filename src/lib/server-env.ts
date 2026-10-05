// Checagem das env vars do servidor na subida (src/instrumentation.ts). Sem
// isso, uma chave ausente só aparecia no meio de um fluxo (checkout, IA,
// console admin) como erro genérico. A mensagem cita o NOME, nunca o valor.
type Env = Record<string, string | undefined>;

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "ANTHROPIC_API_KEY",
] as const;

export function checkServerEnv(env: Env): { missing: string[]; warnings: string[] } {
  const missing = REQUIRED.filter((name) => !env[name]?.trim());
  const warnings: string[] = [];
  if (!env.RESEND_API_KEY?.trim()) warnings.push("RESEND_API_KEY ausente: avisos por email não serão enviados.");
  if (env.EMAIL_TEST_ALLOWLIST !== undefined) {
    warnings.push("EMAIL_TEST_ALLOWLIST definida: emails só saem para a lista de teste.");
  }
  if (env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) warnings.push("STRIPE_SECRET_KEY é de teste (sk_test_).");
  return { missing, warnings };
}

// Produção de verdade (VERCEL_ENV=production) não sobe sem as chaves:
// falhar no boot é melhor que falhar no checkout do cliente. Preview, dev e
// o build do CI só avisam.
export function assertServerEnv(env: Env = process.env) {
  const { missing, warnings } = checkServerEnv(env);
  const isProduction = env.VERCEL_ENV === "production";
  for (const w of warnings) (isProduction ? console.error : console.warn)(`[env] ${w}`);
  if (missing.length === 0) return;
  const message = `[env] Variáveis obrigatórias ausentes: ${missing.join(", ")}`;
  if (isProduction) throw new Error(message);
  console.warn(message);
}
