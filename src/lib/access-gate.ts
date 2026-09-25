import { ROUTE_AREA, can } from "@/lib/permissions";

// Decide, no servidor, se a rota de loja pode abrir para esta sessão.
// Duas camadas, nesta ordem:
//   1. Assinatura: conta bloqueada (trial vencido, cancelada, sem pagamento)
//      só alcança as telas de cobrança e o próprio perfil.
//   2. Perfil (RBAC): mesma tabela de src/lib/permissions.js que o menu usa.
// Rotas fora da tabela (404) e do console (/admin) não passam por aqui.

// permissions.js é JS; tipa só o que o gate lê.
const AREA_BY_ROUTE = ROUTE_AREA as Record<string, { id: string; staff?: boolean } | undefined>;

export type SessionAccess = "ok" | "past_due" | "unpaid" | "trial_ended" | "canceled" | "no_tenant";

export const BLOCKED_LANDING: Partial<Record<SessionAccess, string>> = {
  trial_ended: "/trial-ended",
  canceled: "/account/cancelled",
  unpaid: "/billing/past-due",
};

const ALWAYS_REACHABLE_WHEN_BLOCKED = new Set(["/profile", ...Object.values(BLOCKED_LANDING)]);

export function gateStoreRoute(pathname: string, ctx: { role: string | null; access: SessionAccess }): string | null {
  if (ctx.access === "no_tenant") return "/complete-signup";

  const landing = BLOCKED_LANDING[ctx.access];
  if (landing) {
    if (ALWAYS_REACHABLE_WHEN_BLOCKED.has(pathname)) return null;
    const area = AREA_BY_ROUTE[pathname];
    const isBilling = area?.id === "billing";
    if (!isBilling || !ctx.role || !can(ctx.role, pathname)) return landing;
    return null;
  }

  const area = AREA_BY_ROUTE[pathname];
  if (!area || area.staff) return null;
  if (!ctx.role || !can(ctx.role, pathname)) {
    return `/access-denied?route=${encodeURIComponent(pathname)}`;
  }
  return null;
}
