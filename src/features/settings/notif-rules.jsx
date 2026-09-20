"use client";


export const NOTIF_RULES = [
  { g: 'Estoque', rows: [
    { id: 'rupture', l: 'Ruptura de estoque', d: 'Um SKU chegou a zero', app: true, mail: true, when: 'na hora' },
    { id: 'low', l: 'Abaixo do estoque mínimo', d: 'Itens que precisam de reposição', app: true, mail: true, when: 'resumo diário' },
    { id: 'transfer', l: 'Transferência pendente', d: 'Recebimento não confirmado em 48 h', app: true, mail: true, when: 'na hora' },
    { id: 'divergence', l: 'Divergência de inventário', d: 'Ajustes acima de R$ 200', app: true, mail: true, when: 'na hora' },
    { id: 'count', l: 'Contagem em aberto', d: 'Sessão de inventário parada há mais de 3 dias', app: true, mail: false, when: 'resumo semanal' },
  ]},
  { g: 'Vendas e caixa', rows: [
    { id: 'cash', l: 'Caixa não fechou', d: 'Diferença na conferência do turno', app: true, mail: true, when: 'na hora' },
    { id: 'discount', l: 'Desconto acima do limite', d: 'Venda com desconto que exige aprovação', app: true, mail: false, when: 'na hora' },
    { id: 'daily', l: 'Resumo do dia', d: 'Receita, unidades, ticket médio e ruptura', app: false, mail: true, when: 'diário às 20:00' },
    { id: 'weekly', l: 'Resumo da semana', d: 'Comparativo entre unidades e top produtos', app: false, mail: true, when: 'semanal, segunda 08:00' },
    { id: 'goal', l: 'Meta da unidade em risco', d: 'Projeção abaixo da meta do mês', app: true, mail: true, when: 'semanal' },
  ]},
  { g: 'Produtos e preços', rows: [
    { id: 'price', l: 'Alteração de preço', d: 'Quando alguém muda preço de venda', app: true, mail: false, when: 'na hora' },
    { id: 'promo', l: 'Promoção encerrando', d: 'Dois dias antes do fim da vigência', app: true, mail: true, when: 'na hora' },
    { id: 'newprod', l: 'Produto cadastrado sem foto ou atributo', d: 'Catálogo incompleto', app: false, mail: true, when: 'resumo semanal' },
    { id: 'abc', l: 'Mudança de classe ABC', d: 'Produto migrou de A para B ou de B para C', app: true, mail: false, when: 'mensal' },
  ]},
  { g: 'Inteligência artificial', rows: [
    { id: 'aiqueue', l: 'Sugestões esperando revisão', d: 'Fila de aprovação com itens pendentes', app: true, mail: true, when: 'resumo diário' },
    { id: 'anomaly', l: 'Anomalia detectada', d: 'Estoque fantasma, padrão de perda, quebra silenciosa', app: true, mail: true, when: 'na hora' },
    { id: 'aiquota', l: 'Cota de IA em 80%', d: 'Aviso antes de a IA pausar no mês', app: true, mail: true, when: 'na hora' },
    { id: 'aibuy', l: 'Sugestão de compra da semana', d: 'A IA monta a lista de reposição e envia por email', app: true, mail: true, when: 'semanal, segunda 08:00' },
  ]},
  { g: 'Plataforma e conta', rows: [
    { id: 'invoice', l: 'Fatura emitida ou paga', d: 'Cobrança da assinatura', app: true, mail: true, when: 'na hora' },
    { id: 'overdue', l: 'Fatura vencida', d: 'Risco de suspensão do acesso', app: true, mail: true, when: 'na hora' },
    { id: 'limit', l: 'Limite do plano perto do teto', d: 'SKUs, usuários ou lojas em 90%', app: true, mail: true, when: 'na hora' },
    { id: 'user', l: 'Convite pendente há 5 dias', d: 'Usuário não aceitou o acesso', app: true, mail: false, when: 'resumo semanal' },
    { id: 'login', l: 'Acesso de novo dispositivo', d: 'Segurança da conta', app: true, mail: true, when: 'na hora' },
    { id: 'release', l: 'Novidades do Stoqmate', d: 'Recursos novos e melhorias', app: false, mail: true, when: 'mensal' },
  ]},
];
