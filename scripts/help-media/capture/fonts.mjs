import fs from 'node:fs';
import path from 'node:path';
const fontsDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'node_modules/geist/dist/fonts');
const b64 = (f) => fs.readFileSync(path.join(fontsDir, f)).toString('base64');
export const FONT_CSS = `@font-face{font-family:'Geist';font-weight:100 900;font-style:normal;src:url(data:font/woff2;base64,${b64('geist-sans/Geist-Variable.woff2')}) format('woff2');}
@font-face{font-family:'Geist Mono';font-weight:100 900;font-style:normal;src:url(data:font/woff2;base64,${b64('geist-mono/GeistMono-Variable.woff2')}) format('woff2');}`;
// Serve a Geist localmente no lugar do Google Fonts (bloqueado pelo proxy do ambiente).
export async function withLocalFonts(ctx) {
  await ctx.route(/fonts\.googleapis\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: FONT_CSS }));
  await ctx.route(/fonts\.gstatic\.com/, (r) => r.fulfill({ status: 204, body: '' }));
}
