-- Fase 8 — relatórios reais (vendas, categorias, atributos, lucratividade,
-- curva ABC). `security invoker` em todas: RLS de sales/sale_items/products
-- já restringe ao tenant, sem precisar repetir a checagem aqui.

create function public.fn_sales_report(p_start timestamptz, p_end timestamptz)
returns jsonb
language sql
stable
set search_path = public
as $$
  with s as (
    select * from public.sales where created_at >= p_start and created_at < p_end and status = 'completed'
  ),
  si as (
    select sale_items.*, s.created_at, s.store_id
    from public.sale_items
    join s on s.id = sale_items.sale_id
  ),
  si_cost as (
    select si.*, coalesce(p.cost_price, 0) as unit_cost, p.category_id, p.brand, p.min_stock
    from si join public.products p on p.id = si.product_id
  ),
  totals as (
    select coalesce(sum(total), 0) as revenue, count(*) as sale_count from s
  ),
  agg_units_cost as (
    select coalesce(sum(qty), 0) as units, coalesce(sum(qty * unit_cost), 0) as cost from si_cost
  ),
  daily as (
    select coalesce(jsonb_agg(jsonb_build_object('date', d, 'revenue', revenue) order by d), '[]'::jsonb) as series
    from (select date_trunc('day', created_at) as d, sum(total) as revenue from s group by 1) x
  ),
  by_store as (
    select coalesce(jsonb_agg(jsonb_build_object('store_id', store_id, 'name', store_name, 'revenue', revenue) order by revenue desc), '[]'::jsonb) as data
    from (
      select s.store_id, st.name as store_name, sum(s.total) as revenue
      from s join public.stores st on st.id = s.store_id
      group by s.store_id, st.name
    ) x
  ),
  by_category as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'category_id', category_id, 'name', name, 'code', code, 'icon', icon, 'color', color,
      'unit', unit, 'unit_plural', unit_plural, 'units', units, 'revenue', revenue, 'cost', cost
    ) order by revenue desc), '[]'::jsonb) as data
    from (
      select c.id as category_id, c.name, c.code, c.icon, c.color, c.unit, c.unit_plural,
        sum(sc.qty) as units, sum(sc.total) as revenue, sum(sc.qty * sc.unit_cost) as cost
      from si_cost sc join public.categories c on c.id = sc.category_id
      group by c.id, c.name, c.code, c.icon, c.color, c.unit, c.unit_plural
    ) x
  ),
  stock_by_product as (
    select product_id, sum(qty) as stock_qty from public.stock_balances group by product_id
  ),
  by_product as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'product_id', product_id, 'sku', sku, 'name', name, 'brand', brand,
      'category_id', category_id, 'category_name', category_name,
      'units', units, 'revenue', revenue, 'cost', cost, 'stock_qty', stock_qty
    ) order by revenue desc), '[]'::jsonb) as data
    from (
      select sc.product_id, p.sku, p.name, sc.brand, sc.category_id, c.name as category_name,
        sum(sc.qty) as units, sum(sc.total) as revenue, sum(sc.qty * sc.unit_cost) as cost,
        coalesce(max(sbp.stock_qty), 0) as stock_qty
      from si_cost sc
      join public.products p on p.id = sc.product_id
      join public.categories c on c.id = sc.category_id
      left join stock_by_product sbp on sbp.product_id = sc.product_id
      group by sc.product_id, p.sku, p.name, sc.brand, sc.category_id, c.name
      order by sum(sc.total) desc
      limit 200
    ) x
  )
  select jsonb_build_object(
    'revenue', (select revenue from totals),
    'sale_count', (select sale_count from totals),
    'units', (select units from agg_units_cost),
    'cost', (select cost from agg_units_cost),
    'daily_series', (select series from daily),
    'by_store', (select data from by_store),
    'by_category', (select data from by_category),
    'by_product', (select data from by_product)
  );
$$;
grant execute on function public.fn_sales_report(timestamptz, timestamptz) to authenticated;

create function public.fn_attribute_sales_report(p_category_id uuid, p_start timestamptz, p_end timestamptz)
returns jsonb
language sql
stable
set search_path = public
as $$
  with s as (
    select id from public.sales where created_at >= p_start and created_at < p_end and status = 'completed'
  ),
  si as (
    select si.qty, si.total, p.attrs
    from public.sale_items si
    join s on s.id = si.sale_id
    join public.products p on p.id = si.product_id
    where p.category_id = p_category_id
  ),
  kv as (
    select ca.key, ca.position, e.value, si.qty, si.total
    from public.category_attributes ca
    cross join si
    left join lateral jsonb_each_text(si.attrs) e on e.key = ca.key
    where ca.category_id = p_category_id
  ),
  grouped as (
    select key, position, value, sum(qty) as units, sum(total) as revenue
    from kv
    where value is not null
    group by key, position, value
  )
  select coalesce(jsonb_object_agg(key, rows), '{}'::jsonb)
  from (
    select key, jsonb_agg(jsonb_build_object('value', value, 'units', units, 'revenue', revenue) order by revenue desc) as rows
    from grouped
    group by key
  ) x;
$$;
grant execute on function public.fn_attribute_sales_report(uuid, timestamptz, timestamptz) to authenticated;

create function public.fn_monthly_profit(p_months integer default 6)
returns jsonb
language sql
stable
set search_path = public
as $$
  with months as (
    select date_trunc('month', now()) - (interval '1 month' * gs) as month_start
    from generate_series(0, greatest(p_months - 1, 0)) gs
  ),
  s as (
    select id, created_at from public.sales where status = 'completed'
  ),
  si as (
    select si.qty, si.total, coalesce(p.cost_price, 0) as unit_cost, s.created_at
    from public.sale_items si
    join s on s.id = si.sale_id
    join public.products p on p.id = si.product_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'month_start', m.month_start,
    'revenue', coalesce(agg.revenue, 0),
    'cost', coalesce(agg.cost, 0)
  ) order by m.month_start), '[]'::jsonb)
  from months m
  left join (
    select date_trunc('month', created_at) as month_start, sum(total) as revenue, sum(qty * unit_cost) as cost
    from si
    group by 1
  ) agg on agg.month_start = m.month_start;
$$;
grant execute on function public.fn_monthly_profit(integer) to authenticated;
