import { open, go, shot } from './cap.mjs';
const pw = (process.env.DEMO_PASSWORD ?? '');
// INVITE_TOKENS='{"vendedor":"<token>","estoquista":"<token>","financeiro":"<token>"}'
// (select role, token from invites where tenant_id = <tenant demo> — ver sql/03-situacoes.sql)
const TOKENS = JSON.parse(process.env.INVITE_TOKENS ?? '{}');
const invites = [
  ['vendedor', TOKENS.vendedor, 'Lucas Martins'],
  ['estoquista', TOKENS.estoquista, 'Bruna Tavares'],
  ['financeiro', TOKENS.financeiro, 'Rogério Nunes'],
];
for (const [role, token, name] of invites) {
  const { browser, ctx, page } = await open();
  await go(page, `/invite?token=${token}`);
  await page.getByPlaceholder('Diego Castro').fill(name);
  await page.getByPlaceholder('••••••••').fill(pw);
  const cb = page.locator('input[type=checkbox]');
  if (await cb.count()) await cb.first().check();
  if (role === 'vendedor') await shot(page, 'convite-aceitar', page.getByPlaceholder('••••••••'));
  await page.locator('button.btn-primary.btn-lg').click();
  await page.waitForURL(/dashboard|onboarding|first-run/, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
  console.log(role, page.url());
  await ctx.storageState({ path: `state-${role}.json` });
  await browser.close();
}
