// Permissões — FONTE ÚNICA. O que cada perfil alcança, por rota.
//
// A regra que este arquivo existe para impedir: permissão decidida caso a caso,
// espalhada pelo código. Aqui cada área tem uma linha, cada perfil tem um nível,
// e tanto a navegação quanto a tela de acesso negado leem daqui.
//
// IMPORTANTE para o desenvolvimento: esta tabela é o contrato do CLIENTE e do
// SERVIDOR. Esconder o item de menu não é permissão — é cortesia. Toda rota
// abaixo precisa da mesma checagem na API, senão o vendedor chega no relatório
// digitando o endereço.
//
// COBERTURA TOTAL É OBRIGATÓRIA. can() nega rota desconhecida, então uma rota
// fora desta tabela fica inacessível para todo mundo, inclusive o proprietário.
// auditRoutes() (ver permissions.test.js) compara com o mapa real de rotas e
// falha o teste quando alguém adiciona uma tela e esquece de classificá-la.

export const ACCESS = { none: 0, view: 1, edit: 2, full: 3 };
export const ACCESS_LABEL = { none: 'Sem acesso', view: 'Só consulta', edit: 'Pode editar', full: 'Controle total' };

// Os quatro perfis de fábrica do lojista. No plano Rede ele cria perfis
// próprios, mas sempre como cópia editada de um destes.
export const ROLES = [
  { id: 'vendedor', name: 'Vendedor', desc: 'Opera o balcão. Vê o que precisa para vender e nada sobre o dinheiro da empresa.' },
  { id: 'estoquista', name: 'Gestor de Estoque', desc: 'Compra, recebe, confere e ajusta. Não mexe em assinatura nem em usuários.' },
  { id: 'financeiro', name: 'Gestor Financeiro', desc: 'Vê custo, margem e lucratividade. Cuida da assinatura e do fiscal. Não altera estoque.' },
  { id: 'proprietario', name: 'Proprietário', desc: 'Tudo, em todas as unidades da rede. É quem concede acesso aos outros.' },
];

// O console da plataforma não é do lojista — é da equipe Stoqmate. Fica fora
// da matriz do cliente de propósito: nenhum perfil de loja alcança /admin.
export const STAFF = { id: 'plataforma', name: 'Equipe Stoqmate', desc: 'Console interno da plataforma. Nenhum perfil de loja alcança estas telas.' };

// Áreas do produto. A ordem é a da sensibilidade: operação em cima, dinheiro
// e governança embaixo.
export const AREAS = [
  {
    id: 'account', name: 'Início e conta',
    why: 'Todo mundo entra em algum lugar e cuida do próprio perfil.',
    routes: ['/dashboard', '/profile', '/notifications', '/settings/notifications', '/first-run', '/help'],
    access: { vendedor: 'edit', estoquista: 'edit', financeiro: 'edit', proprietario: 'full' },
  },
  {
    id: 'pos', name: 'Balcão e vendas',
    why: 'Quem está no caixa precisa vender sem pedir ajuda.',
    routes: ['/pos', '/cash', '/receipt', '/customers', '/customers/detail'],
    access: { vendedor: 'edit', estoquista: 'edit', financeiro: 'view', proprietario: 'full' },
  },
  {
    id: 'catalog', name: 'Catálogo de produtos',
    why: 'O vendedor consulta para atender; cadastrar e precificar é do estoque.',
    routes: ['/products', '/products/detail', '/products/new', '/products/edit', '/products/import',
      '/products/pricing', '/categories', '/labels', '/mobile/capture', '/search'],
    access: { vendedor: 'view', estoquista: 'edit', financeiro: 'view', proprietario: 'full' },
  },
  {
    id: 'stock', name: 'Estoque e movimentações',
    why: 'Ajustar saldo é a operação mais fácil de esconder um furo. Fica com o estoque.',
    routes: ['/stock', '/stock/history', '/stock/movement', '/stock/entry', '/stock/entry/ocr', '/stock/sale',
      '/stock/transfer', '/stock/transfer/receive', '/stock/exchange', '/stock/return', '/stock/adjustment',
      '/stock/count', '/stock/receive/match', '/mobile/count', '/shelves', '/shelves/new', '/shelves/edit'],
    access: { vendedor: 'view', estoquista: 'edit', financeiro: 'view', proprietario: 'full' },
  },
  {
    id: 'purchasing', name: 'Compras e fornecedores',
    why: 'Emitir pedido compromete dinheiro da empresa.',
    routes: ['/purchase-orders', '/purchase-orders/new', '/suppliers', '/suppliers/new', '/suppliers/edit', '/suppliers/detail'],
    access: { vendedor: 'none', estoquista: 'edit', financeiro: 'view', proprietario: 'full' },
  },
  {
    id: 'promos', name: 'Promoções',
    why: 'Desconto é margem saindo. Quem cria precisa responder por ela.',
    routes: ['/promotions', '/promotions/new', '/promotions/edit'],
    access: { vendedor: 'view', estoquista: 'edit', financeiro: 'edit', proprietario: 'full' },
  },
  {
    id: 'ai', name: 'Ferramentas de IA',
    why: 'Cada operação gasta crédito, e a sugestão só vira ação com a permissão da área que ela afeta.',
    routes: ['/ai', '/ai/queue', '/ai/anomalies', '/ai/forecast', '/ai/enrich'],
    access: { vendedor: 'none', estoquista: 'edit', financeiro: 'view', proprietario: 'full' },
  },
  {
    id: 'reports', name: 'Relatórios operacionais',
    why: 'Giro, curva ABC e venda por categoria ajudam quem opera. Não expõem margem.',
    routes: ['/reports', '/reports/sales', '/reports/categories', '/reports/attributes', '/reports/abc', '/exports'],
    access: { vendedor: 'view', estoquista: 'view', financeiro: 'view', proprietario: 'full' },
  },
  {
    id: 'money', name: 'Custo, margem e lucratividade',
    why: 'O preço de compra é o segredo comercial da loja. É o corte mais importante da tabela.',
    routes: ['/reports/profit'],
    access: { vendedor: 'none', estoquista: 'view', financeiro: 'edit', proprietario: 'full' },
  },
  {
    id: 'network', name: 'Visão da rede',
    why: 'Comparar unidades é conversa de dono e de quem responde pela rede.',
    routes: ['/network'],
    access: { vendedor: 'none', estoquista: 'view', financeiro: 'view', proprietario: 'full' },
  },
  {
    id: 'fiscal', name: 'Emissão fiscal',
    why: 'Certificado digital e série de nota errados param a loja inteira.',
    routes: ['/settings/fiscal'],
    access: { vendedor: 'none', estoquista: 'none', financeiro: 'edit', proprietario: 'full' },
  },
  {
    id: 'billing', name: 'Assinatura e cobrança',
    why: 'Só quem paga muda o plano, o cartão ou cancela.',
    routes: ['/settings/subscription', '/settings/subscription/change', '/settings/subscription/annual',
      '/settings/subscription/cancel', '/settings/subscription/invoice', '/settings/credits',
      '/billing/past-due', '/limit-reached', '/ai/credits-empty', '/account/cancelled'],
    access: { vendedor: 'none', estoquista: 'none', financeiro: 'edit', proprietario: 'full' },
  },
  {
    id: 'company', name: 'Dados da empresa',
    why: 'Razão social, logo e cor aparecem no cupom e no relatório que sai da loja.',
    routes: ['/settings', '/settings/branding', '/settings/store-data'],
    access: { vendedor: 'none', estoquista: 'view', financeiro: 'edit', proprietario: 'full' },
  },
  {
    id: 'people', name: 'Usuários, unidades e permissões',
    why: 'Quem concede acesso pode conceder a si mesmo. Fica só com o dono.',
    routes: ['/settings/units', '/settings/users', '/settings/roles', '/settings/audit'],
    access: { vendedor: 'none', estoquista: 'none', financeiro: 'none', proprietario: 'full' },
  },
  {
    id: 'console', name: 'Console da plataforma', staff: true,
    why: 'Telas internas da Stoqmate. Nenhum perfil de loja entra aqui, nem o proprietário.',
    routes: ['/login/admin', '/admin', '/admin/stores', '/admin/stores/new', '/admin/stores/edit', '/admin/stores/detail',
      '/admin/plans', '/admin/plans/new', '/admin/plans/edit', '/admin/economics', '/admin/subscriptions',
      '/admin/subscriptions/detail', '/admin/users', '/admin/reports', '/admin/ai-monitoring', '/admin/settings'],
    access: { vendedor: 'none', estoquista: 'none', financeiro: 'none', proprietario: 'none' },
  },
];

// Rotas públicas e de sistema: antes do login ou fora da sessão.
// "Aberta" aqui significa sem exigência de PERFIL (RBAC), não sem exigência de
// sessão — as duas coisas são camadas diferentes. `/complete-signup` é aberta
// nesse sentido (qualquer perfil a alcança) mas exige usuário logado, e o
// `src/proxy.ts` trata essa exceção explicitamente.
export const OPEN_ROUTES = [
  '/', '/pricing', '/terms', '/privacy', '/signup', '/login', '/forgot-password', '/reset-password', '/invite',
  '/checkout', '/onboarding', '/trial-ended', '/verify-email', '/complete-signup',
  '/404-demo', '/error', '/offline', '/session-expired', '/access-denied',
];

export const ROUTE_AREA = (() => {
  const m = {};
  AREAS.forEach(a => a.routes.forEach(r => { m[r] = a; }));
  return m;
})();

export const TENANT_AREAS = AREAS.filter(a => !a.staff);
export const COVERED_COUNT = Object.keys(ROUTE_AREA).length + OPEN_ROUTES.length;

// Telas que existem só pra gravar (formulário de movimentação, cadastro,
// reajuste). Quem tem "Só consulta" na área não abre: antes o vendedor via o
// formulário inteiro e só descobria no "Confirmar" que o banco recusa.
export const EDIT_ROUTES = new Set([
  '/products/new', '/products/edit', '/products/import', '/products/pricing', '/mobile/capture',
  '/stock/entry', '/stock/entry/ocr', '/stock/transfer', '/stock/transfer/receive', '/stock/exchange',
  '/stock/return', '/stock/adjustment', '/stock/count', '/stock/receive/match', '/mobile/count',
  '/shelves/new', '/shelves/edit',
  '/purchase-orders/new', '/suppliers/new', '/suppliers/edit',
  '/promotions/new',
  '/settings/branding', '/settings/store-data',
]);

// A pergunta que o app faz em toda navegação e a API repete em todo endpoint.
export function can(roleId, route, level = 'view') {
  if (OPEN_ROUTES.indexOf(route) > -1) return true;
  const area = ROUTE_AREA[route];
  if (!area) return false;                       // rota nova é negada até ser classificada
  const needed = EDIT_ROUTES.has(route) && ACCESS[level] < ACCESS.edit ? 'edit' : level;
  return ACCESS[area.access[roleId] || 'none'] >= ACCESS[needed];
}
export function areaFor(route) { return ROUTE_AREA[route] || null; }
export function rolesThatCan(route, level = 'view') {
  return ROLES.filter(r => can(r.id, route, level)).map(r => r.name);
}
// Frase pronta para a tela de acesso negado — sem texto solto em lugar nenhum.
export function whoCanReach(route) {
  const names = rolesThatCan(route, 'view');
  if (!names.length) return 'Nenhum perfil de loja alcança esta tela.';
  if (names.length === 1) return `Só o perfil ${names[0]} alcança esta tela.`;
  return `Alcançam esta tela: ${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}.`;
}

// Auditoria: roda no teste (permissions.test.js), compara com o mapa real e
// avisa nos dois sentidos. Rota sem área trava usuário; rota fantasma infla a
// cobertura que a tela mostra.
export function auditRoutes(realRoutes) {
  const real = realRoutes || [];
  if (!real.length) return null;
  const known = new Set([...Object.keys(ROUTE_AREA), ...OPEN_ROUTES]);
  const missing = real.filter(r => !known.has(r));
  const phantom = [...known].filter(r => real.indexOf(r) < 0);
  if (missing.length) console.error('[permissions] rotas sem área (ninguém acessa):', missing);
  if (phantom.length) console.error('[permissions] rotas na tabela que não existem:', phantom);
  return { total: real.length, covered: real.length - missing.length, missing, phantom };
}
