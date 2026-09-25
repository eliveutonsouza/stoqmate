-- Buckets públicos aceitavam qualquer tipo e tamanho: dava pra hospedar HTML
-- ou SVG com script no domínio do storage. Limites batem com o que a UI
-- promete (fotos até 5 MB, logo e avatar até 2 MB). SVG sai da lista.

update storage.buckets
  set file_size_limit = 5 * 1024 * 1024,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
  where id = 'product-photos';

update storage.buckets
  set file_size_limit = 2 * 1024 * 1024,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
  where id in ('store-branding', 'avatars');
