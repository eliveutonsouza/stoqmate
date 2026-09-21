// Mock deliberadamente mantido — decisão do desenvolvedor (2026-09-21).
// Alimenta 7 telas próprias de billing (cancel-subscription, plan-change,
// switch-to-annual, invoice-detail, account-cancelled, past-due,
// trial-ended) que ficaram sem rota de navegação real desde que a
// arquitetura de assinatura migrou pra Stripe Checkout + Customer Portal
// (settings-subscription.jsx só usa createCheckoutSessionAction/
// createPortalSessionAction — nunca navega pra cá). NÃO são código morto
// esquecido: o dev pediu pra manter os arquivos como estão, sem religar,
// como reserva pro dia em que trocar de ferramenta de billing e quiser
// telas próprias de novo. Não backendizar nem deletar sem pedido explícito.
import { PLANS } from '@/lib/plans';

export const SUB = {
  planId: 'controle',
  cycle: 'monthly',
  units: 3,
  nextCharge: '01 de outubro de 2026',
  card: 'Visa •••• 4242',
};

export const subPlan = () => PLANS.find(p => p.id === SUB.planId);

export const subTotal = () => subPlan().monthly * SUB.units;

// Faixa de aviso fixa no topo do app. É a mesma peça em todos os estados de
// exceção — o usuário aprende um único lugar onde a conta fala com ele.
