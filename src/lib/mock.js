// Stoqmate — multi-store inventory for any product category.
// The domain is category-driven: each category declares its own attribute schema
// and unit of measure, and the SKU is generated from that schema.

export const CATEGORIES = [
  {
    id: 'calcados', name: 'Calçados', icon: 'Box', color: '#B45309',
    cssVar: 'var(--cat-calcados)', cssInk: 'var(--cat-calcados-ink)',
    unit: 'par', unitPlural: 'pares', code: 'CAL',
    attributes: [
      { key: 'cor', label: 'Cor', type: 'color', values: ['Preto', 'Branco', 'Cinza', 'Azul Marinho', 'Rosa', 'Verde'] },
      { key: 'numeracao', label: 'Numeração', type: 'size', values: ['36', '37', '38', '39', '40', '41', '42', '43'] },
    ],
    skus: 584, stock: 3418, active: true,
  },
  {
    id: 'vestuario', name: 'Vestuário', icon: 'Shirt', color: '#7C3AED',
    cssVar: 'var(--cat-vestuario)', cssInk: 'var(--cat-vestuario-ink)',
    unit: 'peça', unitPlural: 'peças', code: 'VES',
    attributes: [
      { key: 'cor', label: 'Cor', type: 'color', values: ['Preto', 'Branco', 'Cinza', 'Azul', 'Vermelho', 'Bege'] },
      { key: 'tamanho', label: 'Tamanho', type: 'size', values: ['PP', 'P', 'M', 'G', 'GG', 'XG'] },
    ],
    skus: 412, stock: 2864, active: true,
  },
  {
    id: 'eletronicos', name: 'Eletrônicos', icon: 'Zap', color: '#1D4FD7',
    cssVar: 'var(--cat-eletronicos)', cssInk: 'var(--cat-eletronicos-ink)',
    unit: 'unidade', unitPlural: 'unidades', code: 'ELE',
    attributes: [
      { key: 'cor', label: 'Cor', type: 'color', values: ['Preto', 'Branco', 'Cinza', 'Azul'] },
      { key: 'capacidade', label: 'Capacidade', type: 'spec', values: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'] },
    ],
    skus: 186, stock: 742, active: true,
  },
  {
    id: 'casa', name: 'Casa & Decoração', icon: 'Home', color: '#0F766E',
    cssVar: 'var(--cat-casa)', cssInk: 'var(--cat-casa-ink)',
    unit: 'unidade', unitPlural: 'unidades', code: 'CAS',
    attributes: [
      { key: 'cor', label: 'Cor', type: 'color', values: ['Branco', 'Bege', 'Cinza', 'Verde', 'Marrom'] },
      { key: 'material', label: 'Material', type: 'spec', values: ['Algodão', 'Cerâmica', 'Vidro', 'Madeira', 'Inox'] },
    ],
    skus: 268, stock: 1906, active: true,
  },
  {
    id: 'alimentos', name: 'Alimentos & Bebidas', icon: 'Coffee', color: '#A16207',
    cssVar: 'var(--cat-alimentos)', cssInk: 'var(--cat-alimentos-ink)',
    unit: 'unidade', unitPlural: 'unidades', code: 'ALI',
    attributes: [
      { key: 'sabor', label: 'Sabor', type: 'spec', values: ['Tradicional', 'Intenso', 'Descafeinado', 'Frutas Vermelhas'] },
      { key: 'peso', label: 'Peso', type: 'spec', values: ['250 g', '500 g', '1 kg', '5 kg'] },
    ],
    skus: 142, stock: 3280, active: true,
  },
  {
    id: 'papelaria', name: 'Papelaria', icon: 'Book', color: '#BE185D',
    cssVar: 'var(--cat-papelaria)', cssInk: 'var(--cat-papelaria-ink)',
    unit: 'unidade', unitPlural: 'unidades', code: 'PAP',
    attributes: [
      { key: 'cor', label: 'Cor', type: 'color', values: ['Preto', 'Azul', 'Vermelho', 'Verde'] },
      { key: 'formato', label: 'Formato', type: 'spec', values: ['A4', 'A5', 'Ofício', 'Carta'] },
    ],
    skus: 96, stock: 4120, active: true,
  },
];

export const catById = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];

export const MOCK = {
  categories: CATEGORIES,
  catById,

  store: {
    name: 'Bonsucesso Varejo',
    unit: 'Loja Centro',
    plan: 'Controle',
    user: { name: 'Ana Ribeiro', role: 'Gestora de Estoque', initials: 'AR' },
    siblings: [
      { name: 'Loja Centro', city: 'São Paulo · SP', skus: 1688, current: true },
      { name: 'Loja Shopping Norte', city: 'São Paulo · SP', skus: 1204 },
      { name: 'Loja Campinas', city: 'Campinas · SP', skus: 896 },
      { name: 'Centro de Distribuição', city: 'Guarulhos · SP', skus: 4210 },
    ],
  },

  admin: { user: { name: 'Carlos Mendes', role: 'Super Admin', initials: 'CM' } },

  // === STORE DASHBOARD ===
  metrics: [
    { label: 'Receita do mês', value: 'R$ 412.680', delta: '+12,4%', trend: 'up', sub: 'vs. mês anterior', spark: [12,14,11,15,17,19,18,22,24,21,26,28] },
    { label: 'Unidades vendidas', value: '4.286', delta: '+8,1%', trend: 'up', sub: '1.142 vendas registradas', spark: [10,12,11,13,14,12,15,18,17,19,22,24] },
    { label: 'Itens em estoque', value: '16.330', delta: '−2,3%', trend: 'down', sub: '1.688 SKUs em 6 categorias', spark: [25,24,24,23,22,21,21,20,20,19,18,17] },
    { label: 'Giro de estoque', value: '3,2×', delta: '+0,4', trend: 'up', sub: 'média de 38 dias em estoque', spark: [20,21,22,21,23,24,23,25,26,25,27,28] },
  ],

  salesSeries: [
    { d: '15 Ago', v: 10820 }, { d: '17', v: 11240 }, { d: '19', v: 10980 },
    { d: '21', v: 13120 }, { d: '23', v: 12840 }, { d: '25', v: 15240 },
    { d: '27', v: 14580 }, { d: '29', v: 17120 }, { d: '01 Set', v: 16840 },
    { d: '03', v: 19240 }, { d: '05', v: 18580 }, { d: '07', v: 21120 },
    { d: '09', v: 20420 }, { d: '11', v: 23240 }, { d: '13', v: 25180 },
  ],

  // Products spanning every category — attrs keyed to the category schema
  topProducts: [
    { cat: 'eletronicos', brand: 'Foneclear', name: 'Fone Bluetooth ANC', attrs: { cor: 'Preto', capacidade: '—' }, sold: 184, revenue: 55020, stock: 42 },
    { cat: 'calcados', brand: 'Olympikus', name: 'Tênis Esporte 3', attrs: { cor: 'Preto', numeracao: '41' }, sold: 148, revenue: 41412, stock: 86 },
    { cat: 'vestuario', brand: 'Malharia Sul', name: 'Camiseta Algodão Pima', attrs: { cor: 'Branco', tamanho: 'M' }, sold: 312, revenue: 27768, stock: 204 },
    { cat: 'alimentos', brand: 'Serra Alta', name: 'Café em Grãos', attrs: { sabor: 'Intenso', peso: '1 kg' }, sold: 428, revenue: 25680, stock: 312 },
    { cat: 'casa', brand: 'Casa Viva', name: 'Jogo de Toalhas', attrs: { cor: 'Bege', material: 'Algodão' }, sold: 96, revenue: 18240, stock: 64 },
    { cat: 'papelaria', brand: 'Norma', name: 'Caderno Pautado 200f', attrs: { cor: 'Preto', formato: 'A4' }, sold: 386, revenue: 13124, stock: 428 },
  ],

  lowStock: [
    { sku: 'ELE-FONE-PR-128', cat: 'eletronicos', brand: 'Foneclear', name: 'Fone Bluetooth ANC', variant: 'Preto · 128 GB', qty: 2 },
    { sku: 'CAL-ESP3-PR-38', cat: 'calcados', brand: 'Olympikus', name: 'Tênis Esporte 3', variant: 'Preto · 38', qty: 1 },
    { sku: 'VES-CPIM-BR-GG', cat: 'vestuario', brand: 'Malharia Sul', name: 'Camiseta Algodão Pima', variant: 'Branco · GG', qty: 3 },
    { sku: 'ALI-CAFE-IN-5KG', cat: 'alimentos', brand: 'Serra Alta', name: 'Café em Grãos', variant: 'Intenso · 5 kg', qty: 2 },
  ],

  movements: [
    { time: '14:38', type: 'sale', cat: 'eletronicos', desc: 'Venda · Fone Bluetooth ANC / Preto', qty: -1, value: 'R$ 299,00', user: 'Lucas' },
    { time: '14:24', type: 'sale', cat: 'alimentos', desc: 'Venda · Café em Grãos / Intenso / 1 kg', qty: -3, value: 'R$ 180,00', user: 'Lucas' },
    { time: '13:50', type: 'entry', cat: 'vestuario', desc: 'Entrada · Camiseta Algodão Pima / Branco', qty: 120, value: 'R$ 4.320,00', user: 'Ana' },
    { time: '11:12', type: 'return', cat: 'calcados', desc: 'Devolução · Tênis Esporte 3 / Preto / 40', qty: 1, value: 'R$ 279,90', user: 'Lucas' },
    { time: '10:45', type: 'transfer', cat: 'casa', desc: 'Transferência · Jogo de Toalhas → Loja Campinas', qty: -24, value: '—', user: 'Ana' },
    { time: '10:18', type: 'exchange', cat: 'vestuario', desc: 'Troca · Camiseta Algodão Pima / M → G', qty: 0, value: '—', user: 'Lucas' },
    { time: '09:32', type: 'sale', cat: 'papelaria', desc: 'Venda · Caderno Pautado 200f / A4', qty: -12, value: 'R$ 408,00', user: 'Marina' },
    { time: '09:05', type: 'entry', cat: 'eletronicos', desc: 'Entrada · Fone Bluetooth ANC / Preto', qty: 48, value: 'R$ 7.560,00', user: 'Ana' },
  ],

  categoryMix: [
    { id: 'eletronicos', revenue: 118420, units: 642 },
    { id: 'calcados', revenue: 96280, units: 848 },
    { id: 'vestuario', revenue: 74560, units: 1284 },
    { id: 'alimentos', revenue: 58240, units: 986 },
    { id: 'casa', revenue: 42180, units: 342 },
    { id: 'papelaria', revenue: 23000, units: 184 },
  ],

  // === ADMIN ===
  adminMetrics: [
    { label: 'MRR', value: 'R$ 84.201', delta: '+9,2%', trend: 'up', sub: '127 assinaturas ativas', spark: [50,52,55,58,60,62,65,68,72,75,80,84] },
    { label: 'Redes ativas', value: '127', delta: '+11', trend: 'up', sub: '318 lojas · 14 em trial', spark: [98,102,108,112,115,118,120,122,123,124,125,127] },
    { label: 'Churn (30d)', value: '2,1%', delta: '−0,4pp', trend: 'up', sub: '3 cancelamentos', spark: [3.2,3.0,2.9,2.8,2.7,2.6,2.5,2.4,2.3,2.3,2.2,2.1] },
    { label: 'Custo IA / mês', value: 'US$ 1.284', delta: '+18,4%', trend: 'down', sub: '4.2M tokens · 18.4k req', spark: [600,720,840,960,1020,1100,1140,1180,1200,1240,1264,1284] },
  ],

  // Tenants are now retailers of every kind, each with a segment
  stores: [
    { name: 'Bonsucesso Varejo', segment: 'Varejo multicategoria', city: 'São Paulo · SP', plan: 'Controle', status: 'active', mrr: 'R$ 447', users: 8, skus: 1688, units: 4, since: 'Fev 2025' },
    { name: 'Ferragens União', segment: 'Material de construção', city: 'Curitiba · PR', plan: 'Controle', status: 'active', mrr: 'R$ 298', users: 5, skus: 2412, units: 2, since: 'Mar 2025' },
    { name: 'TechPoint', segment: 'Eletrônicos', city: 'Belo Horizonte · MG', plan: 'Rede', status: 'active', mrr: 'R$ 1.953', users: 12, skus: 1208, units: 7, since: 'Jan 2025' },
    { name: 'Boutique Alecrim', segment: 'Vestuário', city: 'Recife · PE', plan: 'Balcão', status: 'trial', mrr: '—', users: 2, skus: 286, units: 1, since: 'Set 2026' },
    { name: 'Distribuidora Plaza', segment: 'Atacado alimentício', city: 'Porto Alegre · RS', plan: 'Controle', status: 'past_due', mrr: 'R$ 447', users: 6, skus: 3728, units: 3, since: 'Out 2024' },
    { name: 'Farmácia Vida', segment: 'Farmácia', city: 'Fortaleza · CE', plan: 'Rede', status: 'active', mrr: 'R$ 1.674', users: 9, skus: 4942, units: 6, since: 'Nov 2024' },
    { name: 'Casa & Cia Decor', segment: 'Casa e decoração', city: 'Salvador · BA', plan: 'Controle', status: 'active', mrr: 'R$ 298', users: 4, skus: 918, units: 2, since: 'Abr 2025' },
    { name: 'Papelaria Central', segment: 'Papelaria', city: 'Brasília · DF', plan: 'Balcão', status: 'active', mrr: 'R$ 79', users: 2, skus: 342, units: 1, since: 'Fev 2026' },
    { name: 'Autopeças Norte', segment: 'Autopeças', city: 'Manaus · AM', plan: 'Controle', status: 'trial', mrr: '—', users: 3, skus: 1064, units: 2, since: 'Set 2026' },
    { name: 'Mercado Bom Preço', segment: 'Supermercado', city: 'Goiânia · GO', plan: 'Controle', status: 'active', mrr: 'R$ 447', users: 7, skus: 5502, units: 3, since: 'Dez 2024' },
  ],

  planDistribution: [
    { name: 'Balcão', count: 34, mrr: 13260, color: 'var(--fg-faint)' },
    { name: 'Controle', count: 68, mrr: 60520, color: 'var(--accent)' },
    { name: 'Rede', count: 25, mrr: 37250, color: 'var(--fg)' },
  ],

  // Segments served — proves the product is not vertical-locked
  segments: [
    { name: 'Varejo multicategoria', stores: 28, skus: 48200 },
    { name: 'Vestuário e calçados', stores: 24, skus: 62400 },
    { name: 'Alimentos e bebidas', stores: 19, skus: 31800 },
    { name: 'Eletrônicos', stores: 16, skus: 18600 },
    { name: 'Material de construção', stores: 14, skus: 42100 },
    { name: 'Farmácia e saúde', stores: 12, skus: 38900 },
    { name: 'Casa e decoração', stores: 9, skus: 12400 },
    { name: 'Outros', stores: 5, skus: 8200 },
  ],

  aiUsage: [
    { day: '01', cost: 32, req: 480 }, { day: '02', cost: 38, req: 540 },
    { day: '03', cost: 41, req: 580 }, { day: '04', cost: 36, req: 510 },
    { day: '05', cost: 44, req: 620 }, { day: '06', cost: 39, req: 560 },
    { day: '07', cost: 45, req: 640 }, { day: '08', cost: 48, req: 680 },
    { day: '09', cost: 43, req: 610 }, { day: '10', cost: 51, req: 720 },
    { day: '11', cost: 47, req: 660 }, { day: '12', cost: 54, req: 760 },
    { day: '13', cost: 49, req: 690 }, { day: '14', cost: 58, req: 820 },
  ],

  aiModels: [
    { model: 'gpt-4o', label: 'Classificação automática de produtos', requests: 8240, tokens: '2.1M', cost: 612, share: 47 },
    { model: 'gpt-4o-mini', label: 'OCR de notas fiscais de entrada', requests: 6480, tokens: '1.4M', cost: 312, share: 24 },
    { model: 'gpt-4-turbo', label: 'Previsão de demanda e reposição', requests: 2940, tokens: '480k', cost: 248, share: 19 },
    { model: 'text-embedding-3', label: 'Busca semântica no catálogo', requests: 820, tokens: '180k', cost: 112, share: 10 },
  ],

  recentLogs: [
    { time: '14:42:18', store: 'TechPoint', model: 'gpt-4o', tokens: 1840, cost: 0.024, status: 'ok' },
    { time: '14:41:52', store: 'Bonsucesso Varejo', model: 'gpt-4o-mini', tokens: 920, cost: 0.004, status: 'ok' },
    { time: '14:41:11', store: 'Farmácia Vida', model: 'gpt-4o', tokens: 2240, cost: 0.029, status: 'ok' },
    { time: '14:40:38', store: 'Mercado Bom Preço', model: 'gpt-4-turbo', tokens: 480, cost: 0.014, status: 'ok' },
    { time: '14:40:02', store: 'Boutique Alecrim', model: 'gpt-4o-mini', tokens: 1120, cost: 0.005, status: 'ok' },
    { time: '14:39:18', store: 'Ferragens União', model: 'gpt-4o', tokens: 1620, cost: 0.021, status: 'rate_limit' },
  ],
};



