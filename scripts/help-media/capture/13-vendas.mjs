import { open, go, shot, cardOf, pick } from './cap.mjs';
const { browser, page } = await open('state-owner.json');
const T = (t) => page.getByText(t, { exact: false }).first();
const B = (n) => page.getByRole('button', { name: n }).first();
const dialog = () => page.locator('[role=dialog]').first();

// PDV (tablet)
const tab = await open('state-owner.json', { width: 1180, height: 820 }, { hasTouch: true });
const tp = tab.page;
await go(tp, '/pos');
await shot(tp, 'pdv-tela', tp.getByPlaceholder('Bipe o produto ou busque por nome/SKU'));
await tp.getByPlaceholder('Bipe o produto ou busque por nome/SKU').fill('café'); await tp.waitForTimeout(1800);
await shot(tp, 'pdv-busca', tp.getByPlaceholder('Bipe o produto ou busque por nome/SKU').locator('xpath=ancestor::div[3]'));
const card = tp.locator('button', { hasText: 'Café em Grãos' }).first();
await card.click().catch(() => {}); await tp.waitForTimeout(400);
await tp.getByPlaceholder('Bipe o produto ou busque por nome/SKU').fill('pendrive'); await tp.waitForTimeout(1800);
await tp.locator('button', { hasText: 'Pendrive Ultra' }).first().click().catch(() => {}); await tp.waitForTimeout(500);
await shot(tp, 'pdv-carrinho', tp.getByText(/Cobrar e finalizar/).first().locator('xpath=ancestor::div[3]'));
await tp.getByRole('button', { name: 'PIX' }).first().click().catch(() => {}); await tp.waitForTimeout(300);
await shot(tp, 'pdv-pagamento', tp.getByRole('button', { name: 'PIX' }).first().locator('xpath=ancestor::div[2]'));
await tab.browser.close();

// Venda completa
await go(page, '/stock/sale');
await shot(page, 'venda-inicio');
await pick(page, 'tenis', 'CAL-TENISE-PR-40');
await pick(page, 'camiseta', 'VES-CAMISE-PR-G');
await shot(page, 'venda-produtos', cardOf(page, 'Qtd'));
await page.getByPlaceholder(/Consumidor final/).fill('mariana'); await page.waitForTimeout(1500);
await page.locator('button', { hasText: 'Mariana Souza' }).first().click().catch(() => {}); await page.waitForTimeout(500);
await shot(page, 'venda-cliente', page.getByText('Mariana Souza').first().locator('xpath=ancestor::div[3]'));
await B(/Desconto no total/).click(); await page.waitForTimeout(500);
await shot(page, 'venda-desconto', dialog());
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await B(/Dividir em outra forma/).click().catch(() => {}); await page.waitForTimeout(500);
await shot(page, 'venda-pagamento', T('Dividir').locator('xpath=ancestor::div[contains(@class,"card")][1]'));
await browser.close();
