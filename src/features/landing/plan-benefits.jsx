"use client";


// Todo recurso está nos três planos (ver FEATURE_MATRIX em lib/plans.js); o
// que muda é o tamanho: lojas, usuários, SKUs e créditos de IA. Os números
// aparecem no card, lidos da tabela de planos — aqui só o texto.
export const PLAN_BENEFITS = {
  balcao: { head: null, items: [
    'PDV de balcão, caixa e várias formas de pagamento',
    'Entrada, venda, troca e devolução',
    'Importação de planilha e código de barras',
    'Relatórios de venda, margem e curva ABC',
  ]},
  controle: { head: 'Os mesmos recursos, com mais espaço:', items: [
    'Várias lojas, com transferência e conferência',
    'SKUs ilimitados',
    'Mais usuários, cada um no seu perfil de acesso',
    'Mais créditos de IA para nota por foto e previsão',
  ]},
  rede: { head: 'Os mesmos recursos, sem teto:', items: [
    'Lojas e usuários ilimitados',
    'Visão consolidada da rede',
    'A maior cota de créditos de IA',
  ]},
};
