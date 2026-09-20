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
