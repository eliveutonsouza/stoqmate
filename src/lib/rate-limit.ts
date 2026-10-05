import "server-only";
import { headers } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

// Rate limit dos endpoints públicos (login, cadastro, recuperação, 2FA,
// aprovação de desconto). As chamadas ao Supabase Auth saem do IP da Vercel,
// então o limite por IP do próprio Supabase não separa um atacante dos
// outros clientes — o limite tem que ser aplicado aqui, com o IP real.
//
// Janela fixa em Postgres (fn_rate_limit_hit, só service_role: exposta ao
// client, qualquer um queimaria a cota do email de outra pessoa). Exceção
// autorizada ao uso de service-role fora de features/admin
// (.spec/architecture.md).
//
// Falha do banco não bloqueia login (fail-open + log): indisponibilidade do
// limitador não pode virar indisponibilidade do app.

export const LIMIT_MESSAGE = "Muitas tentativas. Espere alguns minutos e tente de novo.";

export type RateRule = { key: string; max: number; windowSeconds: number };

export async function clientIp(): Promise<string> {
  const h = await headers();
  // Na Vercel x-forwarded-for é reescrito pela borda; o 1º é o cliente.
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

// true = pode seguir. Todas as regras contam o hit (não para na primeira).
export async function allowRequest(rules: RateRule[]): Promise<boolean> {
  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch (err) {
    console.error("[rate-limit] sem service role", err instanceof Error ? err.message : err);
    return true;
  }
  const results = await Promise.all(rules.map(async (r) => {
    const { data, error } = await admin.rpc("fn_rate_limit_hit", {
      p_key: r.key, p_max: r.max, p_window_seconds: r.windowSeconds,
    });
    if (error) {
      console.error("[rate-limit] fn_rate_limit_hit", error.message);
      return true;
    }
    return data !== false;
  }));
  return results.every(Boolean);
}

// Atalho dos fluxos de auth: por IP e, quando há, por email (normalizado).
export async function allowAuthAttempt(action: string, email: unknown, limits: { ip: number; email?: number; windowSeconds: number }) {
  const ip = await clientIp();
  const rules: RateRule[] = [{ key: `${action}:ip:${ip}`, max: limits.ip, windowSeconds: limits.windowSeconds }];
  if (typeof email === "string" && email.trim() && limits.email) {
    rules.push({ key: `${action}:email:${email.trim().toLowerCase()}`, max: limits.email, windowSeconds: limits.windowSeconds });
  }
  return allowRequest(rules);
}
