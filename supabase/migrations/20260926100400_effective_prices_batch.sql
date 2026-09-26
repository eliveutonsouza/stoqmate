-- Preço efetivo (promoção ativa) em lote, pra grade do POS tablet mostrar o
-- mesmo valor que fn_confirm_sale vai cobrar. Mesma regra de
-- fn_effective_price; security invoker + filtro de tenant da função base.
create or replace function public.fn_effective_prices(p_product_ids uuid[])
returns table (product_id uuid, price numeric, promotion_name text)
language sql
stable
set search_path = public
as $$
  select ids.id, ep.price, ep.promotion_name
  from unnest(coalesce(p_product_ids, '{}')) as ids(id)
  cross join lateral public.fn_effective_price(ids.id) ep;
$$;
revoke execute on function public.fn_effective_prices(uuid[]) from public, anon;
grant execute on function public.fn_effective_prices(uuid[]) to authenticated;
