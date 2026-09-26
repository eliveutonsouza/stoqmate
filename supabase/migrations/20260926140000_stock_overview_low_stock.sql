-- "SKUs em alerta" ignorava produto sem nenhuma linha de saldo (nunca teve
-- estoque): a lista "Precisa de atenção" mostrava o item e o card dizia 0.
-- Agora a base é o produto ativo, com saldo 0 quando não há linha.
create or replace function public.fn_stock_overview()
 returns jsonb
 language sql
 stable
 set search_path to 'public'
as $function$
  with balances as (
    select product_id, sum(qty) as qty from public.stock_balances group by product_id
  )
  select jsonb_build_object(
    'sku_count', (select count(*) from public.products where active),
    'total_qty', (select coalesce(sum(qty), 0) from public.stock_balances),
    'total_cost_value', (
      select case when public.fn_can_see_cost() then coalesce(sum(sb.qty * public.fn_product_cost(p.id)), 0) end
      from public.stock_balances sb join public.products p on p.id = sb.product_id
    ),
    'low_stock_count', (
      select count(*) from public.products p
      left join balances b on b.product_id = p.id
      where p.active and p.min_stock > 0 and coalesce(b.qty, 0) < p.min_stock
    ),
    'rupture_count', (
      select count(*) from public.products p
      where p.active and coalesce((select b.qty from balances b where b.product_id = p.id), 0) = 0
    )
  );
$function$;
