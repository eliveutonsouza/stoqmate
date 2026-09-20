"use client";


export const PLAN_BENEFITS = {
  balcao: { head: null, items: [
    'PDV de balcão e fechamento de caixa',
    'Importação de planilha e código de barras',
    'Entrada, venda, troca e devolução',
    'Pergunta em linguagem natural para a IA',
  ]},
  controle: { head: 'Tudo do Balcão, mais:', items: [
    'Lucratividade, margem e curva ABC',
    'Leitura de nota fiscal por foto',
    'Previsão de demanda e reposição sugerida',
    'Transferência entre lojas e conferência pelo celular',
  ]},
  rede: { head: 'Tudo do Controle, mais:', items: [
    'Visão consolidada da rede',
    'Detecção de anomalia diária',
    'Preço sugerido por elasticidade',
    'Conferência cega no recebimento, API e CSM dedicado',
  ]},
};
