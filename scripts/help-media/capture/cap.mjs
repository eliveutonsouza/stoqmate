// Helpers de captura: cada shot salva PNG e o retângulo de foco (% da tela) em shots/meta.json.
import { chromium } from 'playwright';
import fs from 'node:fs';
import { withLocalFonts } from './fonts.mjs';

export const BASE = process.env.BASE_URL ?? 'http://localhost:3100';
export const VW = 1440, VH = 900;
const META = 'shots/meta.json';
const meta = fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : {};

export async function open(state, viewport = { width: VW, height: VH }, extra = {}) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1.5, storageState: state && fs.existsSync(state) ? state : undefined, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', ...extra });
  await withLocalFonts(ctx);
  await ctx.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.scrollBehavior = 'auto'; }); });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { if (!/#418/.test(e.message)) console.log('pageerror:', e.message.slice(0, 160)); });
  return { browser, ctx, page };
}

export async function go(page, path) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
}

// Card mais interno que contém o texto.
export const cardOf = (page, text) => page.locator('.card', { has: page.getByText(text, { exact: false }) }).last();

// target: locator opcional para o destaque. pad em px.
export async function shot(page, name, target, pad = 8) {
  const vp = page.viewportSize();
  await page.mouse.move(vp.width - 2, vp.height - 2); // tira hover
  let focus = null;
  if (target) {
    await target.scrollIntoViewIfNeeded({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(500);
    const b = await target.boundingBox({ timeout: 4000 }).catch(() => null);
    if (!b) console.log('  ! sem foco:', name);
    else {
      const x = Math.max(0, b.x - pad), y = Math.max(0, b.y - pad);
      const w = Math.min(vp.width - x, b.width + pad * 2), h = Math.min(vp.height - y, b.height + pad * 2);
      focus = { x: +((x / vp.width) * 100).toFixed(2), y: +((y / vp.height) * 100).toFixed(2), w: +((w / vp.width) * 100).toFixed(2), h: +((h / vp.height) * 100).toFixed(2) };
    }
  } else await page.waitForTimeout(200);
  await page.screenshot({ path: `shots/${name}.png` });
  meta[name] = { focus, url: page.url().replace(BASE, ''), vw: vp.width, vh: vp.height };
  fs.writeFileSync(META, JSON.stringify(meta, null, 2));
  console.log('shot', name, focus ? 'foco' : '');
}

// Seleciona um produto no ProductPicker pelo termo e SKU.
export async function pick(page, term, sku, nth = 0) {
  const input = page.getByPlaceholder('Buscar por SKU, código de barras, marca ou nome…').nth(nth);
  await input.click(); await input.fill(term); await page.waitForTimeout(1300);
  await page.locator('button', { hasText: sku }).first().dispatchEvent('mousedown');
  await page.waitForTimeout(600);
}
