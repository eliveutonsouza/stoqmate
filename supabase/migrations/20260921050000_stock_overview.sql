-- ============================================================
-- fn_stock_overview — números agregados de estoque pro dashboard e pro
-- hub de estoque. `security invoker` (sem `security definer`): só lê
-- tabelas que já têm RLS por tenant (products/stock_balances), então o
-- resultado já sai isolado por tenant sem precisar elevar privilégio —
-- mesmo padrão de fn_sales_report.
-- ============================================================

create function public.fn_stock_overview()
returns jsonb
language sql
stable
set search_path = public
as $$
  with balances as (
    select product_id, sum(qty) as qty from public.stock_balances group by product_id
  )
  select jsonb_build_object(
    'sku_count', (select count(*) from public.products where active),
    'total_qty', (select coalesce(sum(qty), 0) from public.stock_balances),
    'total_cost_value', (
      select coalesce(sum(sb.qty * p.cost_price), 0)
      from public.stock_balances sb join public.products p on p.id = sb.product_id
    ),
    'low_stock_count', (
      select count(*) from balances b
      join public.products p on p.id = b.product_id
      where p.active and p.min_stock > 0 and b.qty < p.min_stock
    ),
    'rupture_count', (
      select count(*) from public.products p
      where p.active and coalesce((select b.qty from balances b where b.product_id = p.id), 0) = 0
    )
  );
$$;

grant execute on function public.fn_stock_overview() to authenticated;
