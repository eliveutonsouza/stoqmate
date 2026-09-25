-- Contadores reais da sidebar numa chamada só (antes eram números fixos do
-- mock). security invoker: cada contagem passa pelo RLS de quem chama, então
-- um perfil sem acesso a uma tabela vê 0, não o número da empresa.

create or replace function public.fn_shell_counts()
returns jsonb
language sql stable
set search_path = public
as $$
  select jsonb_build_object(
    'products',        (select count(*) from public.products where active),
    'categories',      (select count(*) from public.categories),
    'customers',       (select count(*) from public.customers),
    'suppliers',       (select count(*) from public.suppliers where active),
    'stores',          (select count(*) from public.stores),
    'open_orders',     (select count(*) from public.purchase_orders where status = 'sent'),
    'active_promos',   (select count(*) from public.promotions
                          where active and (starts_at is null or starts_at <= now())
                            and (ends_at is null or ends_at >= now())),
    'unread_notifications', (select count(*) from public.notifications where read_at is null)
  )
$$;

revoke execute on function public.fn_shell_counts() from public, anon;
grant execute on function public.fn_shell_counts() to authenticated;
