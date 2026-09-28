// Publica no app as capturas que os artigos usam.
// node shots.mjs [pasta-shots=shots] [saida=out]
// Lê os shot("nome", …) de src/lib/help/content, converte shots/<nome>.png em
// <saida>/shots/<nome>.webp e grava os destaques em src/lib/help/shots.json.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';

const [shotsDir = 'shots', outDir = 'out'] = process.argv.slice(2);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const contentDir = path.join(root, 'src/lib/help/content');
const used = [...new Set(fs.readdirSync(contentDir).flatMap((f) =>
  [...fs.readFileSync(path.join(contentDir, f), 'utf8').matchAll(/shot\("([a-z0-9-]+)"/g)].map((m) => m[1])))].sort();
const meta = JSON.parse(fs.readFileSync(path.join(shotsDir, 'meta.json'), 'utf8'));

fs.mkdirSync(path.join(outDir, 'shots'), { recursive: true });
const out = {};
const missing = [];
for (const name of used) {
  const png = path.join(shotsDir, `${name}.png`);
  if (!fs.existsSync(png) || !meta[name]) { missing.push(name); continue; }
  execFileSync(ffmpeg, ['-v', 'error', '-y', '-i', png, '-vf', "scale='min(1920,iw)':-2", '-c:v', 'libwebp', '-quality', '80', path.join(outDir, 'shots', `${name}.webp`)]);
  out[name] = { focus: meta[name].focus };
}
fs.writeFileSync(path.join(root, 'src/lib/help/shots.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`${Object.keys(out).length} capturas publicadas`);
if (missing.length) { console.error('sem captura:', missing.join(', ')); process.exit(1); }
