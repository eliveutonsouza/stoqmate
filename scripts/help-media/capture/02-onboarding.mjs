import { open, go, shot } from './cap.mjs';
const { browser, ctx, page } = await open('state-owner.json');
await go(page, '/onboarding');
const btn = (n) => page.getByRole('button', { name: n, exact: false });
await page.getByPlaceholder('Ex.: Loja Centro').fill('Bonsucesso Varejo');
await shot(page, 'onboarding-1-nome', page.getByPlaceholder('Ex.: Loja Centro'));
await btn('Continuar').click(); await page.waitForTimeout(500);
await shot(page, 'onboarding-2-logo', page.getByText('Não tenho logo', { exact: false }).first());
await btn('Continuar').click(); await page.waitForTimeout(500);
await shot(page, 'onboarding-3-cor', page.locator('main, body').getByText('Cor', { exact: false }).first());
await btn('Continuar').click(); await page.waitForTimeout(500);
for (const c of ['Vestuário', 'Calçados', 'Eletrônicos', 'Alimentos & Bebidas']) {
  const b = page.getByRole('button', { name: new RegExp(c.replace('&', '&')) }).first();
  if (!(await b.getAttribute('style'))?.includes('accent')) await b.click();
}
await page.waitForTimeout(300);
await shot(page, 'onboarding-4-categorias', page.getByRole('button', { name: /Vestuário/ }).first());
await btn('Continuar').click(); await page.waitForTimeout(500);
await shot(page, 'onboarding-5-fiscal');
await page.getByRole('button', { name: /depois/i }).last().click(); await page.waitForTimeout(500);
await shot(page, 'onboarding-6-revisao', btn('Concluir e entrar'));
await btn('Concluir e entrar').click();
await page.waitForTimeout(6000);
await shot(page, 'onboarding-7-pronto');
await ctx.storageState({ path: 'state-owner.json' });
await browser.close();
