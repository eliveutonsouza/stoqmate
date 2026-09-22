-- ============================================================
-- /profile saía do mock inteiro (nome, sessões, 2FA fixos no código,
-- só "Sair" funcionava). Sessões com device/IP/local foram removidas da
-- UI por não existir esse rastreamento (Supabase Auth não expõe lista
-- de sessões por dispositivo pro client sem admin API) — melhor cortar
-- que inventar. Nome/telefone/foto e 2FA (TOTP nativo do Supabase Auth)
-- ficam reais.
-- ============================================================

alter table public.profiles add column avatar_url text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy avatars_read on storage.objects
  for select to public
  using (bucket_id = 'avatars');

create policy avatars_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
