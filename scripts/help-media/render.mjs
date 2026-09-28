// Render dos vídeos da central de ajuda (1920×1080, 25 fps, H.264 + AAC).
//
// node render.mjs <pasta-audio> <pasta-shots> <pasta-saida> [--stills 2,10,30 | --posters] chave...
//
// <pasta-audio>: saída de audio.py (timeline.json, mix.wav, <chave>.vtt por vídeo)
// <pasta-shots>: capturas PNG + meta.json (capture.mjs)
// Saída: videos/<chave>.mp4, .jpg (poster) e .vtt — prontos para upload.mjs.
// Requer: playwright e ffmpeg-static (npm i no próprio scripts/help-media).
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';

const args = process.argv.slice(2);
const stillsAt = args.includes('--stills') ? args.splice(args.indexOf('--stills'), 2)[1].split(',').map(Number) : null;
const postersOnly = args.includes('--posters') ? (args.splice(args.indexOf('--posters'), 1), true) : false;
const [audioDir, shotsDir, outDir, ...keys] = args;
const FPS = 25;
const here = path.dirname(new URL(import.meta.url).pathname);
const fontsDir = path.join(here, 'node_modules/geist/dist/fonts');

const routes = {
  '/video.html': path.join(here, 'video.html'),
  '/fonts/Geist-Variable.woff2': path.join(fontsDir, 'geist-sans/Geist-Variable.woff2'),
  '/fonts/GeistMono-Variable.woff2': path.join(fontsDir, 'geist-mono/GeistMono-Variable.woff2'),
};
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = routes[p] ?? (p.startsWith('/shots/') ? path.join(shotsDir, path.basename(p)) : null);
  if (!file || !fs.existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.png': 'image/png', '.woff2': 'font/woff2' }[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const meta = JSON.parse(fs.readFileSync(path.join(shotsDir, 'meta.json'), 'utf8'));
fs.mkdirSync(path.join(outDir, 'videos'), { recursive: true });

const browser = await chromium.launch();
for (const key of keys) {
  const tl = JSON.parse(fs.readFileSync(path.join(audioDir, key, 'timeline.json'), 'utf8'));
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.addInitScript(([t, m]) => { window.TIMELINE = t; window.SHOT_META = m; }, [tl, meta]);
  await page.goto(`${base}/video.html`);
  await page.evaluate(() => window.READY);

  if (stillsAt) {
    for (const t of stillsAt) {
      await page.evaluate((x) => window.seek(x), t);
      await page.screenshot({ path: path.join(outDir, `${key}-t${t}.png`) });
    }
    await page.close();
    continue;
  }

  // Poster: o cartão de abertura já montado, sem a legenda da fala.
  await page.evaluate(() => { window.seek(2.2); document.getElementById('cap').style.opacity = '0'; });
  await page.screenshot({ path: path.join(outDir, 'videos', `${key}.jpg`), type: 'jpeg', quality: 82 });
  if (postersOnly) { await page.close(); continue; }

  const out = path.join(outDir, 'videos', `${key}.mp4`);
  const ff = spawn(ffmpeg, ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-i', path.join(audioDir, key, 'mix.wav'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-tune', 'stillimage', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'ignore', 'inherit'] });
  const frames = Math.ceil(tl.duration * FPS);
  for (let f = 0; f < frames; f++) {
    await page.evaluate((x) => window.seek(x), f / FPS);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error(`ffmpeg ${c}`)))));
  fs.copyFileSync(path.join(audioDir, key, `${key}.vtt`), path.join(outDir, 'videos', `${key}.vtt`));
  console.log('ok', key, `${tl.duration.toFixed(1)}s`, `${(fs.statSync(out).size / 1e6).toFixed(1)} MB`);
  await page.close();
}
await browser.close();
server.close();
