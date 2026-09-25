
// Plan architecture and unit economics.
//
// Two research findings drive this file:
//  1. Brazilian small/mid retail SaaS sits at R$ 99–199/mo (competitors R$ 79–379,
//     30-day trials). The old R$ 39/89/149 was below market — it left money on the
//     table AND signalled an inferior product.
//  2. "Unlimited AI" inside a flat subscription destroys gross margin, because COGS
//     now scales with every call. Target is 50–70% margin, not the classic 80%.
//
// The mechanism that reconciles both: CREDITS WITH PER-OPERATION WEIGHT. The shop
// owner sees one simple unit; internally each feature costs what it actually costs.

// ============================================================================
// MODELO DE CUSTO — tudo aqui é derivado de preço de tabela real, não estimado.
// Fontes (set/2026):
//  · Anthropic Claude Haiku 4.5: US$ 1,00 / 1M tokens de entrada, US$ 5,00 / 1M de
//    saída; leitura de cache a 10% da entrada; lote a 50%. (pricepertoken.com,
//    benchlm.ai — conferidos em setembro de 2026)
//  · Câmbio USD/BRL comercial ~5,14; planejamos a 5,40 (topo de 52 semanas 5,61)
//    para não quebrar a margem numa alta do dólar.
//  · Supabase Pro US$ 25/organização + US$ 10 de crédito de compute; Micro incluso,
//    Small US$ 15, Medium US$ 60, Large US$ 110; armazenamento extra US$ 0,125/GB;
//    egress US$ 0,09/GB; PITR 7 dias US$ 100. (supabase.com/pricing)
// ============================================================================

export const FX = 5.40;                 // R$ por US$ usado no planejamento
export const TOKEN = {                  // US$ por 1M tokens — Claude Haiku 4.5
  in: 1.00, out: 5.00, cached: 0.10,
};
export const usd = (u) => u * FX;

// Perfil de tokens medido nos prompts que este app realmente envia.
// cache = parte do prompt que se repete (esquema, taxonomia, instruções) e entra
// a 10% do preço; in = tokens novos da requisição; out = resposta.
export const OP_TOKENS = [
  { id: 'ask',      label: 'Pergunta em linguagem natural', credits: 1, cache: 1500, in: 300,  out: 150,  note: 'O modelo só traduz a pergunta em filtro; a conta é feita no banco.' },
  { id: 'classify', label: 'Classificação no cadastro',     credits: 1, cache: 1000, in: 200,  out: 120,  note: 'Chamada curta por produto, taxonomia em cache.' },
  { id: 'enrich',   label: 'Enriquecimento (por SKU)',      credits: 1, cache: 0,    in: 350,  out: 250,  note: 'Processado em lote de 40 SKUs por chamada.' },
  { id: 'price',    label: 'Preço sugerido (por SKU)',      credits: 2, cache: 0,    in: 2500, out: 300,  note: 'Precisa do histórico de venda no contexto.' },
  { id: 'forecast', label: 'Previsão de demanda (por SKU)', credits: 2, cache: 0,    in: 3000, out: 400,  note: 'Série temporal + calendário comercial brasileiro.' },
  { id: 'ocr',      label: 'Leitura de nota fiscal (foto)', credits: 5, cache: 800,  in: 2500, out: 1800, note: 'Visão: a imagem vira ~2.500 tokens e a saída é um JSON longo.' },
  { id: 'anomaly',  label: 'Varredura de anomalias',        credits: 6, cache: 35000, in: 5000, out: 1200, note: 'Lê catálogo e movimentações; o catálogo fica em cache entre varreduras.' },
];

export const opCost = (o) => usd((o.cache * TOKEN.cached + o.in * TOKEN.in + o.out * TOKEN.out) / 1e6);
export const AI_OPS = OP_TOKENS.map(o => ({ ...o, cost: opCost(o), perCredit: opCost(o) / o.credits }));

// Custo do crédito = pior operação por crédito, com folga. Nenhum mix de uso
// consegue custar mais que isso, então a cota vendida nunca vira prejuízo.
export const CREDIT_WORST = Math.max(...AI_OPS.map(o => o.perCredit));
export const CREDIT_UNIT_COST = Math.ceil(CREDIT_WORST * 1.25 * 1000) / 1000;

// ---------------------------------------------------------------------------
// INFRAESTRUTURA — conta fechada do Supabase para 100 lojas nesta versão do app.
// Premissas: multi-tenant em um único Postgres com RLS; ~150 MB por loja
// (catálogo + 24 meses de movimentações); ~6 usuários por loja (600 MAU, muito
// abaixo dos 100 mil inclusos); dashboards pesados exigem compute Medium.
// ---------------------------------------------------------------------------
export const INFRA_STORES = 100;
export const SUPABASE = [
  { l: 'Plano Pro (por organização)', usd: 25, note: 'Postgres, Auth, Storage, Realtime e Edge Functions no mesmo pacote.' },
  { l: 'Compute Medium (4 GB, 2 vCPU)', usd: 60, note: 'Micro não aguenta 100 tenants com relatório e curva ABC.' },
  { l: 'Crédito de compute incluso', usd: -10, note: 'Todo plano pago traz US$ 10 de crédito.' },
  { l: 'Banco acima dos 8 GB inclusos', usd: 0.88, note: '~15 GB em 100 lojas · US$ 0,125/GB excedente.' },
  { l: 'Egress acima do incluído', usd: 0, note: '~180 GB/mês, dentro dos 250 GB do Pro.' },
  { l: 'Storage de imagens', usd: 0, note: '~60 GB de fotos de produto, dentro dos 100 GB.' },
  { l: 'PITR 7 dias (recuperação a ponto no tempo)', usd: 100, note: 'Inegociável num ERP: perder estoque de um dia é perder o cliente.' },
];
// Custos de plataforma que não são Supabase mas existem todo mês.
export const OTHER_INFRA = [
  { l: 'Hospedagem do front (Vercel Pro)', usd: 20, note: 'Um time, deploy contínuo.' },
  { l: 'Email transacional', usd: 20, note: 'Convites, faturas, alertas de ruptura.' },
  { l: 'Observabilidade e erros', usd: 26, note: 'Logs e rastreio de exceção.' },
  { l: 'Backup externo e DNS/CDN', usd: 15, note: 'Cópia fora do fornecedor principal.' },
];
export const INFRA_TOTAL_USD = [...SUPABASE, ...OTHER_INFRA].reduce((s, i) => s + i.usd, 0);
export const INFRA_TOTAL_BRL = usd(INFRA_TOTAL_USD);
export const INFRA_PER_STORE = INFRA_TOTAL_BRL / INFRA_STORES;

// Ratear a infra igualmente por loja pune o plano de entrada: uma loja Balcão com
// 300 SKUs não pesa no Postgres o mesmo que uma unidade de rede com 5 mil SKUs e
// transferência diária. O rateio é ponderado por consumo real de banco e egress,
// na proporção da base instalada.
export const INFRA_WEIGHTS = { balcao: 0.5, controle: 1.0, rede: 1.6 };
export const INFRA_WEIGHT_UNITS = INSTALLED_BASE_MIX();
export function INSTALLED_BASE_MIX() {
  // proporção da base: 11% Balcão, 55% Controle, 34% Rede em 100 lojas
  return 11 * INFRA_WEIGHTS.balcao + 55 * INFRA_WEIGHTS.controle + 34 * INFRA_WEIGHTS.rede;
}
export const INFRA_PER_WEIGHT = INFRA_TOTAL_BRL / INFRA_WEIGHT_UNITS;
export const infraFor = (plan) => INFRA_PER_WEIGHT * INFRA_WEIGHTS[plan.id];

// Custos variáveis por loja que escalam com o uso, não com a infra.
export const VARIABLE = {
  gatewayPct: 0.0399,   // adquirência no cartão
  gatewayFix: 0.39,     // por transação
  whatsapp: (msgs) => msgs * 0.10,  // conversa de serviço na API oficial
  nfse: 0,              // emissão fiscal ainda fora de escopo
};

export const PLANS = [
  {
    id: 'balcao', name: 'Balcão', monthly: 89, yearly: 890,
    tagline: 'Sair da planilha sem susto no boleto.',
    who: 'Uma loja, até 2 pessoas no caixa.',
    credits: 300,
    limits: { skus: 300, users: 2, stores: 1, cats: 3, history: '12 meses' },
    support: 5, msgs: 15,
  },
  {
    id: 'controle', name: 'Controle', monthly: 149, yearly: 1490,
    tagline: 'O plano de quem já perde dinheiro com ruptura.',
    who: 'Até 3 lojas com estoque de verdade.',
    credits: 1500, popular: true,
    limits: { skus: null, users: 8, stores: 3, cats: null, history: '24 meses' },
    support: 9, msgs: 30,
  },
  {
    id: 'rede', name: 'Rede', monthly: 279, yearly: 2790,
    tagline: 'Operação multi-loja com reposição automática.',
    who: 'Redes que transferem estoque entre unidades.',
    credits: 3500,
    limits: { skus: null, users: null, stores: null, cats: null, history: '5 anos' },
    support: 16, msgs: 50,
  },
];

// Extra credit packs — priced above cost but below the next tier, so the
// natural upgrade path stays cheaper than living on overage.
export const CREDIT_PACKS = [
  { credits: 250, price: 29 },
  { credits: 500, price: 49 },
  { credits: 1500, price: 129 },
];

// What each plan unlocks. Gating logic:
//  · manual tools that cost us nothing → open early, they drive adoption
//  · features that only make sense with several stores → gate by tier, not by cost
//  · AI that is expensive per call → gated by tier AND metered by credits
export const FEATURE_MATRIX = [
  { g: 'Catálogo e cadastro', rows: [
    ['Categorias e atributos personalizados', 3, 'ilimitadas', 'ilimitadas', 'Sem isso o produto não serve a nenhum ramo. Nunca travar.'],
    ['Cadastro manual de produtos', true, true, true, 'Função básica, custo zero.'],
    ['Importação de planilha (XLSX/CSV)', true, true, true, 'Remove a maior barreira de entrada. Travar isso mata a ativação.'],
    ['Código de barras e etiquetas', true, true, true, 'Custo zero, aumenta o uso diário.'],
    ['Reajuste de preços em lote', false, true, true, 'Só importa com catálogo grande — sinal natural de upgrade.'],
    ['Histórico de alterações', '3 meses', '24 meses', '5 anos', 'Retenção custa armazenamento: escalona bem.'],
  ]},
  { g: 'Estoque e balcão', rows: [
    ['PDV de balcão (tablet e desktop)', true, true, true, 'É o coração da operação. Travar espanta o cliente.'],
    ['Entrada, venda, troca, devolução', true, true, true, 'Função básica.'],
    ['Fechamento de caixa por turno', true, true, true, 'Sem isso a loja não fecha o dia.'],
    ['Ajuste e contagem de inventário', true, true, true, 'Custo zero.'],
    ['Conferência pelo celular', false, true, true, 'Diferencial operacional que justifica o tier do meio.'],
    ['Transferência entre lojas', false, true, true, 'Só existe com 2+ lojas. Gate natural.'],
    ['Recebimento com conferência cega', false, false, true, 'Controle de rede madura.'],
  ]},
  { g: 'Compras e fornecedores', rows: [
    ['Cadastro de fornecedores', true, true, true, 'Função básica.'],
    ['Sugestão de reposição por média', false, true, true, 'Cálculo local, mas é valor de gestão — cobra.'],
    ['Pedido de compra', false, true, true, 'Acompanha a reposição.'],
    ['Leitura de XML da NF-e', false, true, true, 'Sem custo de IA (XML é estruturado), mas alto valor percebido.'],
  ]},
  { g: 'Relatórios', rows: [
    ['Vendas e movimentações', true, true, true, 'Relatório essencial retém cliente.'],
    ['Lucratividade e margem', false, true, true, 'A pergunta que o dono faz. Ancora o tier do meio.'],
    ['Curva ABC e giro de estoque', false, true, true, 'Decisão de capital.'],
    ['Visão consolidada da rede', false, false, true, 'Só faz sentido multi-loja.'],
    ['Exportações agendadas por email', false, true, true, 'Custo marginal baixo.'],
  ]},
  { g: 'Inteligência artificial', rows: [
    ['Créditos de IA por mês', '300', '1.500', '3.500', 'Metragem é o que protege a margem.'],
    ['Pergunta em linguagem natural', true, true, true, '1 crédito. Barato e vira hábito — melhor vitrine da IA.'],
    ['Classificação no cadastro', true, true, true, '1 crédito. Acelera a ativação do cliente novo.'],
    ['Enriquecimento de catálogo', false, true, true, '1 crédito/SKU. Em lote, consome rápido.'],
    ['Leitura de nota fiscal por foto', false, true, true, '5 créditos. Operação mais caro do sistema.'],
    ['Previsão de demanda', false, true, true, '2 créditos/SKU.'],
    ['Detecção de anomalia', false, false, true, '6 créditos/varredura. Diária, então é o maior consumo recorrente.'],
    ['Preço sugerido por elasticidade', false, false, true, '2 créditos/SKU.'],
  ]},
  { g: 'Conta e suporte', rows: [
    ['Usuários', '2', '8', 'ilimitados', 'Assento extra custa quase nada, mas sinaliza tamanho.'],
    ['Lojas', '1', '3', 'ilimitadas', 'Principal eixo de expansão de receita.'],
    ['Perfis e permissões', 'básico', 'completo', 'completo', 'Rede precisa separar quem vê custo.'],
    ['Suporte', 'email', 'chat prioritário', 'CSM dedicado', 'Custo de atendimento cresce com o tier.'],
    ['API de integração', false, false, true, 'Suporte de integração é caro.'],
  ]},
];

// Economia derivada — nenhuma margem digitada. Trocar o preço, o câmbio ou a
// conta do Supabase reescreve todos os números do console.
export function planEconomics(plan) {
  const infra = infraFor(plan);
  const support = plan.support;
  const gateway = plan.monthly * VARIABLE.gatewayPct + VARIABLE.gatewayFix;
  const whatsapp = VARIABLE.whatsapp(plan.msgs);
  const fixed = infra + support + gateway + whatsapp;

  const aiCost = plan.credits * CREDIT_UNIT_COST;        // P90: usa a cota inteira
  const aiCostP50 = plan.credits * 0.45 * CREDIT_UNIT_COST;
  const cogs = aiCost + fixed;
  const gross = plan.monthly - cogs;
  const margin = (gross / plan.monthly) * 100;
  const p50Cost = aiCostP50 + fixed;
  const p50Margin = ((plan.monthly - p50Cost) / plan.monthly) * 100;

  // Quantos créditos a loja precisaria consumir para zerar a margem.
  const breakEvenCredits = Math.floor((plan.monthly - fixed) / CREDIT_UNIT_COST);
  const abuseHeadroom = breakEvenCredits / plan.credits;

  return { infra, support, gateway, whatsapp, fixed, aiCost, aiCostP50, cogs, gross, margin, p50Cost, p50Margin, breakEvenCredits, abuseHeadroom };
}

// Plano anual — o mecanismo de fidelidade. Três alavancas, todas com custo
// controlado: desconto de 2 mensalidades, créditos de IA que acumulam dentro do
// ciclo (o teto anual é o mesmo, então a margem não muda) e preço travado por 12
// meses. Reajuste anual do mercado é ~IPCA; travar preço custa pouco e retém muito.
export const ANNUAL = {
  freeMonths: 2,
  perks: [
    ['Dois meses grátis', 'Paga 10, usa 12. É o desconto embutido no preço anual.'],
    ['Créditos de IA acumulam', 'O que sobra em um mês passa para o próximo dentro do ciclo — no mensal a cota zera.'],
    ['Preço travado por 12 meses', 'Nenhum reajuste durante a vigência, mesmo se a tabela subir.'],
    ['Migração e treinamento inclusos', 'Importação do catálogo e uma sessão com a equipe, sem custo.'],
    ['Boleto liberado', 'Pagamento por boleto ou PIX, além do cartão.'],
  ],
};
export function annualSavings(plan, units = 1) {
  const monthly = plan.monthly * units * 12;
  const yearly = plan.yearly * units;
  return { monthly, yearly, save: monthly - yearly, pct: ((monthly - yearly) / monthly) * 100 };
}

export const MARKET = [
  { name: 'Stoqmate · Controle', price: 149, us: true, note: 'IA inclusa com cota' },
  { name: 'GestãoClick · Prata', price: 199, note: 'sem IA' },
  { name: 'Concorrente A · Intermediário', price: 149.9, note: 'sem IA' },
  { name: 'Concorrente B · Avançado', price: 279.9, note: 'sem IA' },
  { name: 'GestãoClick · Ouro', price: 289, note: 'sem IA' },
  { name: 'GestãoClick · Platina', price: 379, note: 'sem IA' },
];

