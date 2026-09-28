// Publica a mídia da central de ajuda no bucket help-media do Supabase Storage.
//
// node upload.mjs <pasta>   — envia <pasta>/shots/*.webp e <pasta>/videos/*.{mp4,jpg,vtt}
// para help-media/<versão>/..., com cache longo (a versão no caminho invalida).
//
// Requer NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente: o
// bucket não tem policy de escrita de propósito (ver a migration
// 20260928140000_help_media_bucket.sql). A versão tem que bater com
// HELP_MEDIA_VERSION em src/lib/help/media.ts.
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const VERSION = 'v1';
const TYPES = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.vtt': 'text/vtt' };

const [dir] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!dir || !url || !key) {
  console.error('uso: NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node upload.mjs <pasta>');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

const files = ['shots', 'videos'].flatMap((sub) => {
  const d = path.join(dir, sub);
  return fs.existsSync(d) ? fs.readdirSync(d).filter((f) => TYPES[path.extname(f)]).map((f) => path.join(sub, f)) : [];
});

let failed = 0;
for (const rel of files) {
  const body = fs.readFileSync(path.join(dir, rel));
  const { error } = await supabase.storage.from('help-media').upload(`${VERSION}/${rel}`, body, {
    contentType: TYPES[path.extname(rel)], cacheControl: '31536000', upsert: true,
  });
  if (error) { failed++; console.error('falhou', rel, error.message); } else console.log('ok', rel);
}
console.log(`${files.length - failed}/${files.length} arquivos publicados em help-media/${VERSION}/`);
process.exit(failed ? 1 : 0);
