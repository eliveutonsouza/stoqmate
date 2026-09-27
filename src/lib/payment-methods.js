// Formas de pagamento — FONTE ÚNICA pra venda, troca, devolução, recibo e
// relatório. O Stoqmate REGISTRA como o cliente pagou; o dinheiro passa pela
// maquininha/PIX da própria loja, nunca pelo sistema.
//
//   needsCustomer — só com cliente identificado (crédito da loja)
//   touchesCash   — mexe no caixa quando a rede controla caixa
//   installments  — aceita parcelas
//   refund        — pode ser usada pra devolver valor ao cliente
//   enabled       — aparece nas telas; `crediario` volta quando existir
//                   contas a receber (hoje seria só um rótulo sem controle)

export const PAYMENT_METHODS = [
  { id: 'dinheiro', label: 'Dinheiro', short: 'Dinheiro', touchesCash: true, refund: true, enabled: true },
  { id: 'pix', label: 'PIX', short: 'PIX', refund: true, enabled: true },
  { id: 'debito', label: 'Cartão de débito', short: 'Débito', enabled: true },
  { id: 'credito', label: 'Cartão de crédito', short: 'Crédito', installments: true, enabled: true },
  { id: 'credito_loja', label: 'Crédito da loja', short: 'Crédito da loja', needsCustomer: true, refund: true, enabled: true },
  { id: 'outro', label: 'Outro', short: 'Outro', refund: true, enabled: true },
  { id: 'crediario', label: 'Crediário', short: 'Crediário', enabled: false },
  { id: 'dividido', label: 'Dividido', short: 'Dividido', enabled: false },
];

const BY_ID = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.id, m]));

export const SALE_METHODS = PAYMENT_METHODS.filter((m) => m.enabled);
export const REFUND_METHODS = PAYMENT_METHODS.filter((m) => m.enabled && m.refund);

export function paymentLabel(id) {
  return BY_ID[id]?.label ?? id;
}

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

// Soma e quanto falta pra fechar o valor (positivo = falta, negativo = sobra).
export function paymentTotals(payments, expected) {
  const paid = round2((payments ?? []).reduce((s, p) => s + round2(p.amount), 0));
  return { paid, remaining: round2(round2(expected) - paid) };
}

// Mesmas regras do banco (fn_register_payments), pra avisar antes do envio.
// Devolve a mensagem de erro ou null.
export function validatePayments(payments, expected, { customerId = null, refund = false } = {}) {
  const list = payments ?? [];
  if (list.length > 6) return 'No máximo 6 formas de pagamento.';
  for (const p of list) {
    const m = BY_ID[p.method];
    if (!m || !m.enabled || (refund && !m.refund)) return 'Forma de pagamento inválida.';
    if (!(round2(p.amount) > 0)) return `Informe o valor em ${m.label}.`;
    if (m.needsCustomer && !customerId) return `${m.label} exige o cliente identificado.`;
    const inst = Number(p.installments || 1);
    if (inst < 1 || inst > 12 || (inst > 1 && !m.installments)) return 'Parcelas só no cartão de crédito, de 1 a 12.';
  }
  const { remaining } = paymentTotals(list, expected);
  if (Math.abs(remaining) > 0.01) {
    return remaining > 0 ? `Falta distribuir R$ ${remaining.toFixed(2).replace('.', ',')}.` : `As formas somam mais que o total (R$ ${(-remaining).toFixed(2).replace('.', ',')} a mais).`;
  }
  return null;
}
