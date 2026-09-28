-- Central de ajuda (/help): vídeos, legendas e capturas dos tutoriais.
--
-- Bucket público só de leitura: o conteúdo é didático (empresa demo) e é
-- servido por URL pública do Storage para o <video>/<img> da central. Não há
-- policy de escrita — só o service role (scripts/help-media/upload.mjs)
-- publica. Também não há policy de select em storage.objects: a URL pública
-- de bucket público não passa por RLS, e sem policy ninguém LISTA o bucket.
--
-- Limites seguem o padrão de 20260924220300_storage_limits.sql: só os tipos
-- que a central usa, nada de HTML/SVG.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'help-media', 'help-media', true,
  30 * 1024 * 1024,
  array['video/mp4', 'text/vtt', 'image/webp', 'image/jpeg']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
