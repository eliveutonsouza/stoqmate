-- Curva ABC precisa ver TODO produto com estoque, não só os vendidos no
-- período — senão o caso clássico que o relatório existe pra achar (capital
-- parado, giro zero) some da lista.
create function public.fn_abc_report(p_start timestamptz, p_end timestamptz)
returns jsonb
language sql
stable
set search_path = public
as $$
  with sold as (
    select si.product_id, sum(si.qty) as units, sum(si.total) as revenue
    from public.sale_items si
    join public.sales s on s.id = si.sale_id
    where s.created_at >= p_start and s.created_at < p_end and s.status = 'completed'
    group by si.product_id
  ),
  stock as (
    select product_id, sum(qty) as stock_qty from public.stock_balances group by product_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'product_id', p.id, 'sku', p.sku, 'name', p.name,
    'category_id', p.category_id, 'category_name', c.name, 'category_code', c.code, 'category_icon', c.icon, 'category_color', c.color,
    'units', coalesce(sold.units, 0), 'revenue', coalesce(sold.revenue, 0),
    'stock_qty', coalesce(stock.stock_qty, 0), 'stock_value', coalesce(stock.stock_qty, 0) * p.cost_price
  ) order by coalesce(sold.revenue, 0) desc), '[]'::jsonb)
  from public.products p
  join public.categories c on c.id = p.category_id
  left join sold on sold.product_id = p.id
  left join stock on stock.product_id = p.id
  where p.active and (coalesce(sold.units, 0) > 0 or coalesce(stock.stock_qty, 0) > 0);
$$;
grant execute on function public.fn_abc_report(timestamptz, timestamptz) to authenticated;
