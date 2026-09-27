// Lado servidor das formas de pagamento: saneia o que vem do cliente e
// traduz as recusas do banco (fn_register_payments) pra mensagem de tela.

export type PaymentInput = { method: string; amount: number; installments?: number };

const METHODS = new Set(["dinheiro", "pix", "debito", "credito", "credito_loja", "outro"]);

// Só passa lista pequena, com método conhecido e valor numérico; o banco
// refaz todas as regras (soma, parcelas, cliente, caixa).
export function sanitizePayments(input: unknown): PaymentInput[] | null {
  if (input == null) return [];
  if (!Array.isArray(input) || input.length > 6) return null;
  const out: PaymentInput[] = [];
  for (const p of input) {
    if (!p || typeof p !== "object") return null;
    const { method, amount, installments } = p as Record<string, unknown>;
    if (typeof method !== "string" || !METHODS.has(method)) return null;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return null;
    const inst = installments == null ? 1 : Number(installments);
    if (!Number.isInteger(inst)) return null;
    out.push({ method, amount: Math.round(value * 100) / 100, installments: inst });
  }
  return out;
}

// Mensagens que o próprio banco já escreve pra pessoa (ver migration
// 20260927150100_payments_ledger.sql). Devolve null se não for uma delas.
const PASS_THROUGH = [
  "crédito insuficiente",
  "abra o caixa desta loja",
  "as formas de pagamento somam",
  "forma de pagamento inválida",
  "crédito da loja exige",
  "parcelas só no crédito",
  "no máximo 6 formas",
  "estorno maior que",
  "devolução maior que",
  "troca sem diferença",
  "feche os caixas abertos",
  "valor de pagamento precisa",
];

export function paymentFriendlyError(message: string): string | null {
  const hit = PASS_THROUGH.find((k) => message.includes(k));
  if (!hit) return null;
  const text = message.slice(message.indexOf(hit)).trim();
  return text.charAt(0).toUpperCase() + text.slice(1) + (/[.!?)]$/.test(text) ? "" : ".");
}
