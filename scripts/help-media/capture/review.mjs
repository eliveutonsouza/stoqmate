// node review.mjs out.png nome1 nome2 ... → folha 3 colunas com o destaque desenhado
import { chromium } from 'playwright';
import fs from 'node:fs'; import path from 'node:path';
const [out, ...names] = process.argv.slice(2);
const meta = JSON.parse(fs.readFileSync('shots/meta.json', 'utf8'));
const cells = names.map((n) => {
  const f = meta[n]?.focus; const src = 'file://' + path.resolve(`shots/${n}.png`);
  const box = f ? `<div style="position:absolute;left:${f.x}%;top:${f.y}%;width:${f.w}%;height:${f.h}%;border:3px solid #E94B1C;border-radius:6px;box-shadow:0 0 0 2000px rgba(0,0,0,.25)"></div>` : '';
  return `<div style="position:relative;overflow:hidden;height:${Math.round(596*(meta[n]?.vh||900)/(meta[n]?.vw||1440))}px"><img src="${src}" style="position:absolute;inset:0;width:100%;height:100%">${box}<div style="position:absolute;left:0;top:0;background:#000;color:#fff;font:14px sans-serif;padding:2px 6px">${n}</div></div>`;
}).join('');
const html = `<body style="margin:0;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;width:1800px;background:#333">${cells}</body>`;
fs.writeFileSync('review.html', html);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1800, height: 800 } });
await p.goto('file://' + path.resolve('review.html')); await p.waitForLoadState('load'); await p.waitForTimeout(800);
await p.screenshot({ path: out, fullPage: true }); await b.close();
