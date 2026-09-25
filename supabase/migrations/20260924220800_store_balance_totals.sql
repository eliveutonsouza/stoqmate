-- Totais de estoque por loja agregados no banco. O dashboard somava
-- stock_balances inteiro no servidor Next, e o PostgREST corta em 1000
-- linhas: com catálogo grande o total por loja saía menor que o real.
-- security invoker: RLS de stock_balances continua valendo.

create or replace function public.fn_store_balance_totals()
returns table (store_id uuid, sku_count bigint, qty bigint)
language sql stable
set search_path = public
as $$
  select sb.store_id, count(*) filter (where sb.qty > 0), coalesce(sum(sb.qty), 0)
  from public.stock_balances sb
  group by sb.store_id
$$;

revoke execute on function public.fn_store_balance_totals() from public, anon;
grant execute on function public.fn_store_balance_totals() to authenticated;
