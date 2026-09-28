import { open, go, shot, cardOf, pick } from './cap.mjs';
const { browser, page } = await open('state-owner.json');
const T = (t) => page.getByText(t, { exact: false }).first();
const B = (n) => page.getByRole('button', { name: n }).first();
const L = (n) => page.getByLabel(n, { exact: false }).first();

// Compras
await go(page, '/purchase-orders');
await shot(page, 'reposicao-sugeridos', T('Sugeridos').locator('xpath=ancestor::div[2]'));
const boxes = page.locator('tbody input[type=checkbox]');
for (let i = 0; i < Math.min(3, await boxes.count()); i++) await boxes.nth(i).check().catch(() => {});
await page.waitForTimeout(400);
await shot(page, 'reposicao-gerar', B(/Gerar pedido/));
await shot(page, 'pedido-lista', T('Receber').locator('xpath=ancestor::tr[1]'));
await go(page, '/purchase-orders/new');
await shot(page, 'pedido-form');
await go(page, '/purchase-orders');
const conf = page.getByRole('button', { name: /Conferir nota/ }).first();
if (await conf.count()) { await conf.click(); await page.waitForTimeout(2500); await shot(page, 'conferencia-nota'); }
await go(page, '/suppliers');
await shot(page, 'fornecedores-lista', B(/Cadastrar fornecedor/));
await go(page, '/suppliers/new');
await shot(page, 'fornecedor-form', L('Nome do fornecedor'));
// Promoções
await go(page, '/promotions');
await shot(page, 'promocoes-lista', page.getByRole('link', { name: /Criar promoção|Nova promoção/ }).or(B(/Criar promoção|Nova promoção/)).first());
await go(page, '/promotions/new');
await L('Nome da promoção').fill('Dia do Café');
await pick(page, 'café', 'ALI-CAFEGR-TR-500').catch(() => {});
await shot(page, 'promocao-nova', L('Nome da promoção').locator('xpath=ancestor::div[contains(@class,"card")][1]'));
// IA
await go(page, '/ai'); await shot(page, 'ia-hub', cardOf(page, 'Uso por recurso'));
await go(page, '/ai/queue'); await shot(page, 'ia-fila');
await go(page, '/ai/anomalies'); await shot(page, 'ia-anomalias', T('Ruptura').locator('xpath=ancestor::div[contains(@class,"card")][1]'));
await go(page, '/ai/forecast'); await shot(page, 'ia-previsao', B(/Calcular previsão|Recalcular/));
await go(page, '/ai/enrich'); await shot(page, 'ia-enriquecimento');
await go(page, '/search'); await page.getByPlaceholder(/Buscar ou perguntar/).fill('fone'); await page.waitForTimeout(2000);
await shot(page, 'busca-ia', B(/Perguntar/));
// Relatórios
await go(page, '/reports'); await shot(page, 'relatorios-visao');
await go(page, '/reports/sales'); await shot(page, 'rel-vendas', B(/Exportar CSV/));
await go(page, '/reports/categories'); await shot(page, 'rel-categorias');
await go(page, '/reports/abc'); await shot(page, 'rel-abc');
await go(page, '/reports/profit'); await shot(page, 'rel-lucro');
await go(page, '/exports'); await shot(page, 'exportacoes');
// Financeiro
await go(page, '/settings/subscription'); await shot(page, 'assinatura');
await go(page, '/settings/credits'); await shot(page, 'creditos', B(/Comprar créditos/));
await go(page, '/settings/fiscal'); await shot(page, 'fiscal');
// Administração
await go(page, '/settings/store-data'); await shot(page, 'empresa-dados', T('Controlar caixa por turno').locator('xpath=ancestor::div[2]'));
await shot(page, 'empresa-excluir', T('Excluir conta').locator('xpath=ancestor::div[contains(@class,"card")][1]'));
await go(page, '/settings/branding'); await shot(page, 'marca');
await go(page, '/settings/audit'); await shot(page, 'auditoria');
await go(page, '/settings'); await shot(page, 'configuracoes-hub');
await browser.close();

// Visões por cargo
for (const role of ['vendedor', 'estoquista', 'financeiro']) {
  const r = await open(`state-${role}.json`);
  await go(r.page, '/dashboard');
  await shot(r.page, `menu-${role}`, r.page.locator('aside').first());
  if (role === 'vendedor') {
    await go(r.page, '/reports/profit');
    await shot(r.page, 'acesso-negado', r.page.getByRole('button', { name: /Pedir acesso/ }).first());
  }
  await r.browser.close();
}
