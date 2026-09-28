import { open, go, shot, cardOf, pick } from './cap.mjs';
// ids das unidades da empresa demo: select id, name from stores where tenant_id = <tenant demo>
const NORTE = process.env.STORE_NORTE, CENTRO = process.env.STORE_CENTRO;
const { browser, ctx, page } = await open('state-owner.json');
const T = (t) => page.getByText(t, { exact: false }).first();
const B = (n) => page.getByRole('button', { name: n }).first();
const L = (n) => page.getByLabel(n, { exact: false }).first();
const dialog = () => page.locator('[role=dialog]').first();
const setStore = (id) => ctx.addCookies([{ name: 'stoqmate_store', value: id, url: 'http://localhost:3100' }]);

// Venda simples confirmada → recibo
await setStore(CENTRO);
await go(page, '/stock/sale');
await pick(page, 'fone', 'ELE-FONEAN-BR-128');
await page.getByRole('button', { name: 'PIX', exact: true }).first().click().catch(() => {}); await page.waitForTimeout(400);
await shot(page, 'venda-confirmar', B(/Confirmar venda/));
await B(/Confirmar venda/).click(); await page.waitForURL(/receipt/, { timeout: 20000 }).catch(() => {}); await page.waitForTimeout(1500);
await shot(page, 'venda-recibo', B(/Próximo atendimento/));

// Caixa: fechamento (Centro, aberto)
await go(page, '/cash');
await shot(page, 'caixa-fechamento', T('Fechamento de caixa').locator('xpath=ancestor::div[2]'));
await B(/Sangria/).click().catch(() => {}); await page.waitForTimeout(500);
await shot(page, 'caixa-sangria', dialog());
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await shot(page, 'caixa-contagem', cardOf(page, 'R$ 200'));
// Abrir caixa (Norte, fechado)
await setStore(NORTE);
await go(page, '/cash');
await shot(page, 'caixa-abrir', B(/Abrir caixa/));
await setStore(CENTRO);

// Clientes
await go(page, '/customers');
await shot(page, 'clientes-lista', B(/Cadastrar cliente/));
await B(/Cadastrar cliente/).click(); await page.waitForTimeout(500);
await shot(page, 'clientes-novo', dialog());
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await T('Mariana Souza').click(); await page.waitForTimeout(2000);
await shot(page, 'clientes-ficha', B(/Ajustar crédito/));
await B(/Ajustar crédito/).click().catch(() => {}); await page.waitForTimeout(500);
await shot(page, 'clientes-credito', dialog());
await page.keyboard.press('Escape');

// Estoque: painel
await go(page, '/stock');
await shot(page, 'estoque-painel', T('Registrar movimentação').locator('xpath=ancestor::div[2]'));
// Entrada
await go(page, '/stock/entry');
await shot(page, 'entrada-produto', page.getByPlaceholder('Buscar por SKU, código de barras, marca ou nome…').first());
await pick(page, 'fone', 'ELE-FONEAN-PR-128');
await L('Quantidade').fill('24'); await L('Preço de compra unitário').fill('189');
await L('Fornecedor').selectOption({ label: 'TechDistrib' }).catch(() => {}); await L('Nota fiscal').fill('8421');
await shot(page, 'entrada-form', L('Quantidade').locator('xpath=ancestor::div[contains(@class,"card")][1]'));
await shot(page, 'entrada-confirmar', B(/Confirmar entrada/));
await B(/Confirmar entrada/).click(); await page.waitForTimeout(3000);
await shot(page, 'entrada-feita');
// Transferência
await go(page, '/stock/transfer');
await pick(page, 'carregador', 'ELE-CARREG-BR-65W');
await L('Unidade de origem').selectOption({ label: 'Centro de Distribuição' }).catch(() => {});
await L('Unidade de destino').selectOption({ label: 'Loja Centro' }).catch(() => {});
await L('Quantidade').fill('10'); await L('Motivo').selectOption({ index: 1 }).catch(() => {});
await shot(page, 'transf-form', L('Unidade de origem').locator('xpath=ancestor::div[contains(@class,"card")][1]'));
await shot(page, 'transf-pendente', T('pendente').locator('xpath=ancestor::div[2]'));
await go(page, '/stock/transfer/receive');
await shot(page, 'transf-receber', B(/Confirmar recebimento/));
// Troca, devolução, ajuste
await go(page, '/stock/exchange');
await pick(page, 'camiseta', 'VES-CAMISE-PR-M', 0); await pick(page, 'camiseta', 'VES-CAMISE-PR-G', 1);
await L('Motivo da troca').selectOption({ index: 1 }).catch(() => {});
await shot(page, 'troca-form', L('Motivo da troca').locator('xpath=ancestor::div[contains(@class,"card")][1]'));
await go(page, '/stock/return');
await pick(page, 'tenis', 'CAL-TENISE-PR-42');
await L('Motivo').selectOption({ index: 1 }).catch(() => {});
await shot(page, 'devolucao-form', L('Motivo').locator('xpath=ancestor::div[contains(@class,"card")][1]'));
await go(page, '/stock/adjustment');
await pick(page, 'café', 'ALI-CAFEGR-IN-5KG');
await L('Contagem física').fill('1'); await L('Motivo da divergência').selectOption({ index: 1 }).catch(() => {});
await shot(page, 'ajuste-form', L('Contagem física').locator('xpath=ancestor::div[contains(@class,"card")][1]'));
// Contagem
await go(page, '/stock/count');
await shot(page, 'contagem-escopo', cardOf(page, 'Escopo'));
await pick(page, 'pendrive', 'ELE-PENDRI-PR-64');
await pick(page, 'pendrive', 'ELE-PENDRI-PR-128');
await shot(page, 'contagem-itens', cardOf(page, 'Contado'));
await shot(page, 'contagem-fechar', B(/Fechar contagem/));
// Histórico e detalhe
await go(page, '/stock/history');
await shot(page, 'historico-lista', B(/Exportar CSV/));
await page.locator('tbody tr').first().click().catch(() => {}); await page.waitForTimeout(2000);
await shot(page, 'movimento-detalhe');
// Locais
await go(page, '/shelves');
await shot(page, 'locais-lista', B(/Novo local/));
await browser.close();

// Contagem cega no celular
const m = await open('state-owner.json', { width: 390, height: 844 }, { isMobile: true, hasTouch: true });
await go(m.page, '/mobile/count');
await shot(m.page, 'mobile-contagem');
await m.browser.close();
