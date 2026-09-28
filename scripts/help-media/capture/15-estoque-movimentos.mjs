import { open, go, shot, cardOf, pick } from './cap.mjs';
const { browser, page } = await open('state-owner.json');
const B = (n) => page.getByRole('button', { name: n }).first();
const L = (n) => page.getByLabel(n, { exact: false }).first();

// Troca, devolução, ajuste
await go(page, '/stock/exchange');
await pick(page, 'camiseta', 'VES-CAMISE-PR-M', 0); await pick(page, 'camiseta', 'VES-CAMISE-PR-G', 0);
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
