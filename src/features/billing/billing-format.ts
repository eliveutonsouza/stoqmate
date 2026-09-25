// Datas de cobrança sempre em pt-BR e no fuso da operação: o mesmo texto no
// HTML do servidor e na hidratação do cliente (sem timeZone fixo, um
// servidor em UTC e um navegador em -03 discordariam perto da meia-noite).
const TZ = "America/Sao_Paulo";

export function fmtDateLong(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: TZ });
}

export function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ });
}

export function fmtMonthYear(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: TZ });
}

export function fmtInt(n: number): string {
  return n.toLocaleString("pt-BR");
}

export const CYCLE_LABEL: Record<string, string> = { monthly: "mensal", yearly: "anual" };

export const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  trialing: "Em teste",
  active: "Ativa",
  past_due: "Pagamento atrasado",
  canceled: "Cancelada",
  incomplete: "Pendente",
  incomplete_expired: "Expirada",
  unpaid: "Não paga",
};

export const INVOICE_STATUS: Record<string, [string, string]> = {
  paid: ["Paga", "badge-success"],
  open: ["Em aberto", "badge-warning"],
  draft: ["Rascunho", "badge"],
  uncollectible: ["Não cobrável", "badge-danger"],
  void: ["Anulada", "badge"],
};
