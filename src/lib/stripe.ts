import "server-only";
import Stripe from "stripe";

// Server-only — nunca importar de um Client Component. A conta é de teste
// (sk_test) até o desenvolvedor configurar a conta de produção (Fase 9 TODO
// original); nada aqui muda quando isso acontecer, só a chave no ambiente.
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurada.");
  return new Stripe(key);
}
