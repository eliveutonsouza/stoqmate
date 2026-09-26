-- Custo e lucro só para quem tem a área "money" (estoquista, financeiro,
-- proprietário). Vendedor vende pelo preço de tabela ou com desconto
-- aprovado; saber o custo permitiria empurrar desconto até a margem zero e
-- vaza dado comercial. As telas já diziam "margem visível só para gestor
-- financeiro e proprietário" — agora o banco garante.
--
-- Como: leitura das colunas de custo (products.cost_price,
-- stock_movements.unit_cost) revogada de `authenticated`; o custo só sai
-- por funções definer que checam o perfil. Relatórios continuam invoker
-- (RLS isola o tenant) e trocam a leitura direta pela função — para o
-- vendedor, custo/lucro vêm nulos. Escrita (insert/update) não muda.

create or replace function public.fn_can_see_cost()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_access('money', 1);
$$;

create or replace function public.fn_product_cost(p_product_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select p.cost_price from public.products p
  where p.id = p_product_id and p.tenant_id = public.auth_tenant_id() and public.has_access('money', 1);
$$;

create or replace function public.fn_movement_unit_cost(p_movement_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select m.unit_cost from public.stock_movements m
  where m.id = p_movement_id and m.tenant_id = public.auth_tenant_id() and public.has_access('money', 1);
$$;

-- Custo em lote pro app (telas que mostram custo a quem pode ver).
create or replace function public.fn_product_costs(p_product_ids uuid[])
returns table (product_id uuid, cost_price numeric)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.cost_price from public.products p
  where p.id = any(coalesce(p_product_ids, '{}')) and p.tenant_id = public.auth_tenant_id() and public.has_access('money', 1);
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.fn_can_see_cost()', 'public.fn_product_cost(uuid)',
    'public.fn_movement_unit_cost(uuid)', 'public.fn_product_costs(uuid[])'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

CREATE OR REPLACE FUNCTION public.fn_sales_report(p_start timestamp with time zone, p_end timestamp with time zone, p_store_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with s as (
    select * from public.sales
    where created_at >= p_start and created_at < p_end and status = 'completed'
      and (p_store_id is null or store_id = p_store_id)
  ),
  si as (
    select sale_items.*, s.created_at, s.store_id
    from public.sale_items
    join s on s.id = sale_items.sale_id
  ),
  si_cost as (
    select si.*, coalesce(public.fn_product_cost(p.id), 0) as unit_cost, p.category_id, p.brand, p.min_stock
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
      'unit', unit, 'unit_plural', unit_plural, 'units', units, 'revenue', revenue, 'cost', case when public.fn_can_see_cost() then cost end
    ) order by revenue desc), '[]'::jsonb) as data
    from (
      select c.id as category_id, c.name, c.code, c.icon, c.color, c.unit, c.unit_plural,
        sum(sc.qty) as units, sum(sc.total) as revenue, sum(sc.qty * sc.unit_cost) as cost
      from si_cost sc join public.categories c on c.id = sc.category_id
      group by c.id, c.name, c.code, c.icon, c.color, c.unit, c.unit_plural
    ) x
  ),
  stock_by_product as (
    select product_id, sum(qty) as stock_qty from public.stock_balances
    where p_store_id is null or store_id = p_store_id
    group by product_id
  ),
  by_product as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'product_id', product_id, 'sku', sku, 'name', name, 'brand', brand,
      'category_id', category_id, 'category_name', category_name,
      'units', units, 'revenue', revenue, 'cost', case when public.fn_can_see_cost() then cost end, 'stock_qty', stock_qty
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
    'cost', case when public.fn_can_see_cost() then (select cost from agg_units_cost) end,
    'daily_series', (select series from daily),
    'by_store', (select data from by_store),
    'by_category', (select data from by_category),
    'by_product', (select data from by_product)
  );
$function$;

CREATE OR REPLACE FUNCTION public.fn_monthly_profit(p_months integer DEFAULT 6, p_store_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with months as (
    select date_trunc('month', now()) - (interval '1 month' * gs) as month_start
    from generate_series(0, greatest(p_months - 1, 0)) gs
  ),
  s as (
    select id, created_at from public.sales
    where status = 'completed' and (p_store_id is null or store_id = p_store_id)
  ),
  si as (
    select si.qty, si.total, coalesce(public.fn_product_cost(p.id), 0) as unit_cost, s.created_at
    from public.sale_items si
    join s on s.id = si.sale_id
    join public.products p on p.id = si.product_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'month_start', m.month_start,
    'revenue', coalesce(agg.revenue, 0),
    'cost', case when public.fn_can_see_cost() then coalesce(agg.cost, 0) end
  ) order by m.month_start), '[]'::jsonb)
  from months m
  left join (
    select date_trunc('month', created_at) as month_start, sum(total) as revenue, sum(qty * unit_cost) as cost
    from si
    group by 1
  ) agg on agg.month_start = m.month_start;
$function$;

CREATE OR REPLACE FUNCTION public.fn_stock_overview()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
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
      select count(*) from balances b
      join public.products p on p.id = b.product_id
      where p.active and p.min_stock > 0 and b.qty < p.min_stock
    ),
    'rupture_count', (
      select count(*) from public.products p
      where p.active and coalesce((select b.qty from balances b where b.product_id = p.id), 0) = 0
    )
  );
$function$;

CREATE OR REPLACE FUNCTION public.fn_abc_report(p_start timestamp with time zone, p_end timestamp with time zone, p_store_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with sold as (
    select si.product_id, sum(si.qty) as units, sum(si.total) as revenue
    from public.sale_items si
    join public.sales s on s.id = si.sale_id
    where s.created_at >= p_start and s.created_at < p_end and s.status = 'completed'
      and (p_store_id is null or s.store_id = p_store_id)
    group by si.product_id
  ),
  stock as (
    select product_id, sum(qty) as stock_qty from public.stock_balances
    where p_store_id is null or store_id = p_store_id
    group by product_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'product_id', p.id, 'sku', p.sku, 'name', p.name,
    'category_id', p.category_id, 'category_name', c.name, 'category_code', c.code, 'category_icon', c.icon, 'category_color', c.color,
    'units', coalesce(sold.units, 0), 'revenue', coalesce(sold.revenue, 0),
    'stock_qty', coalesce(stock.stock_qty, 0), 'stock_value', coalesce(stock.stock_qty, 0) * public.fn_product_cost(p.id)
  ) order by coalesce(sold.revenue, 0) desc), '[]'::jsonb)
  from public.products p
  join public.categories c on c.id = p.category_id
  left join sold on sold.product_id = p.id
  left join stock on stock.product_id = p.id
  where p.active and (coalesce(sold.units, 0) > 0 or coalesce(stock.stock_qty, 0) > 0);
$function$;

CREATE OR REPLACE FUNCTION public.fn_search_products(p_term text, p_limit integer DEFAULT 8)
 RETURNS TABLE(id uuid, sku text, barcode text, brand text, name text, attrs jsonb, sale_price numeric, cost_price numeric, min_stock integer, category jsonb, stock_balances jsonb, effective_price numeric, promotion_name text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select
    p.id, p.sku, p.barcode, p.brand, p.name, p.attrs, p.sale_price, public.fn_product_cost(p.id) as cost_price, p.min_stock,
    (to_jsonb(c) - 'tenant_id') as category,
    coalesce(
      (select jsonb_agg(jsonb_build_object('store_id', sb.store_id, 'qty', sb.qty)) from public.stock_balances sb where sb.product_id = p.id),
      '[]'::jsonb
    ) as stock_balances,
    ep.price as effective_price,
    ep.promotion_name
  from public.products p
  join public.categories c on c.id = p.category_id
  left join lateral public.fn_effective_price(p.id) ep on true
  where p.sku ilike '%' || public.fn_like_escape(p_term) || '%'
     or p.barcode ilike '%' || public.fn_like_escape(p_term) || '%'
     or p.name ilike '%' || public.fn_like_escape(p_term) || '%'
     or p.brand ilike '%' || public.fn_like_escape(p_term) || '%'
  limit least(greatest(coalesce(p_limit, 8), 1), 50);
$function$;

CREATE OR REPLACE FUNCTION public.fn_replenishment_suggestions(p_store_id uuid)
 RETURNS TABLE(product_id uuid, sku text, name text, brand text, attrs jsonb, category jsonb, stock integer, min_stock integer, sold_30d integer, cover_days numeric, supplier_id uuid, supplier_name text, lead_time_days integer, cost_price numeric, suggest_qty integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select
    p.id, p.sku, p.name, p.brand, p.attrs,
    (to_jsonb(c) - 'tenant_id') as category,
    coalesce(sb.qty, 0) as stock,
    p.min_stock,
    coalesce(sold.qty, 0)::integer as sold_30d,
    case when coalesce(sold.qty, 0) = 0 then null else round(coalesce(sb.qty, 0) / (sold.qty::numeric / 30), 1) end as cover_days,
    s.id as supplier_id, s.name as supplier_name, coalesce(s.lead_time_days, 0)::integer as lead_time_days, public.fn_product_cost(p.id) as cost_price,
    greatest(0, ceil(
      (coalesce(sold.qty, 0)::numeric / 30) * (coalesce(s.lead_time_days, 0) + 30) - coalesce(sb.qty, 0)
    ))::integer as suggest_qty
  from public.products p
  left join public.categories c on c.id = p.category_id
  left join public.suppliers s on s.id = p.supplier_id
  left join public.stock_balances sb on sb.product_id = p.id and sb.store_id = p_store_id
  left join (
    select si.product_id, sum(si.qty) as qty
    from public.sale_items si
    join public.sales sa on sa.id = si.sale_id
    where sa.store_id = p_store_id and sa.created_at >= now() - interval '30 days'
    group by si.product_id
  ) sold on sold.product_id = p.id
  where p.active
  order by suggest_qty desc, p.name;
$function$;

CREATE OR REPLACE FUNCTION public.fn_products_list(p_term text DEFAULT NULL::text, p_category_id uuid DEFAULT NULL::uuid, p_brand text DEFAULT NULL::text, p_stock text DEFAULT NULL::text, p_location_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with params as (
    select nullif(btrim(coalesce(p_term, '')), '') as term
  ),
  pat as (
    select case when term is null then null else '%' || public.fn_like_escape(term) || '%' end as like_pat from params
  ),
  balances as (
    select product_id, sum(qty) as qty from public.stock_balances group by product_id
  ),
  base as (
    select p.id, p.tenant_id, p.category_id, p.supplier_id, p.default_location_id, p.sku, p.barcode, p.brand, p.name, p.attrs, p.sale_price, p.min_stock, p.photo_url, p.notes, p.active, p.created_at, public.fn_product_cost(p.id) as cost_price, coalesce(b.qty, 0)::bigint as stock
    from public.products p
    left join balances b on b.product_id = p.id
  ),
  filtered as (
    select base.* from base, pat
    where (pat.like_pat is null
        or base.sku ilike pat.like_pat
        or base.barcode ilike pat.like_pat
        or base.name ilike pat.like_pat
        or base.brand ilike pat.like_pat)
      and (p_category_id is null or base.category_id = p_category_id)
      and (p_brand is null or base.brand = p_brand)
      and (p_location_id is null or base.default_location_id = p_location_id)
      and (p_stock is null
        or (p_stock = 'in' and base.stock > 0)
        or (p_stock = 'low' and base.min_stock > 0 and base.stock < base.min_stock)
        or (p_stock = 'out' and base.stock <= 0))
  ),
  page as (
    select * from filtered
    order by name, id
    limit greatest(coalesce(p_limit, 50), 0) offset greatest(coalesce(p_offset, 0), 0)
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pg.id, 'sku', pg.sku, 'barcode', pg.barcode, 'brand', pg.brand, 'name', pg.name,
        'attrs', pg.attrs, 'sale_price', pg.sale_price, 'cost_price', pg.cost_price,
        'min_stock', pg.min_stock, 'active', pg.active, 'stock', pg.stock,
        'category', (
          select jsonb_build_object('id', c.id, 'name', c.name, 'code', c.code, 'unit', c.unit,
            'unit_plural', c.unit_plural, 'icon', c.icon, 'color', c.color)
          from public.categories c where c.id = pg.category_id
        ),
        'supplier', (select jsonb_build_object('id', s.id, 'name', s.name) from public.suppliers s where s.id = pg.supplier_id),
        'location', (select jsonb_build_object('id', l.id, 'code', l.code) from public.locations l where l.id = pg.default_location_id)
      ) order by pg.name, pg.id)
      from page pg
    ), '[]'::jsonb)
  );
$function$;

CREATE OR REPLACE FUNCTION public.fn_stock_movements_list(p_term text DEFAULT NULL::text, p_kind text DEFAULT NULL::text, p_store_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with params as (
    select nullif(btrim(coalesce(p_term, '')), '') as term
  ),
  pat as (
    select case when term is null then null else '%' || public.fn_like_escape(term) || '%' end as like_pat from params
  ),
  scoped as (
    select m.id, m.tenant_id, m.store_id, m.product_id, m.kind, m.qty, m.unit_price, m.before_qty, m.after_qty, m.reference_type, m.reference_id, m.reason, m.justification, m.created_by, m.created_at, public.fn_movement_unit_cost(m.id) as unit_cost, p.sku as p_sku, p.name as p_name, p.category_id as p_category_id
    from public.stock_movements m
    join public.products p on p.id = m.product_id, pat
    where (pat.like_pat is null
        or p.sku ilike pat.like_pat
        or p.barcode ilike pat.like_pat
        or p.name ilike pat.like_pat)
      and (p_store_id is null or m.store_id = p_store_id)
  ),
  filtered as (
    select * from scoped where p_kind is null or kind::text = p_kind
  ),
  page as (
    select * from filtered
    order by created_at desc, id desc
    limit greatest(coalesce(p_limit, 50), 0) offset greatest(coalesce(p_offset, 0), 0)
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'all_total', (select count(*) from public.stock_movements),
    'kinds', coalesce((
      select jsonb_agg(jsonb_build_object('kind', kind, 'count', n) order by n desc)
      from (select kind, count(*) as n from scoped group by kind) k
    ), '[]'::jsonb),
    'qty_in', (select coalesce(sum(qty), 0) from filtered where qty > 0),
    'qty_out', (select coalesce(sum(-qty), 0) from filtered where qty < 0),
    'transfers', (select count(*) from filtered where kind = 'transfer'),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pg.id, 'kind', pg.kind, 'qty', pg.qty, 'unit_cost', pg.unit_cost, 'unit_price', pg.unit_price,
        'created_at', pg.created_at, 'reason', pg.reason,
        'product', jsonb_build_object('id', pg.product_id, 'sku', pg.p_sku, 'name', pg.p_name,
          'category', (select jsonb_build_object('id', c.id, 'name', c.name, 'icon', c.icon, 'color', c.color)
                       from public.categories c where c.id = pg.p_category_id)),
        'store', (select jsonb_build_object('id', st.id, 'name', st.name) from public.stores st where st.id = pg.store_id)
      ) order by pg.created_at desc, pg.id desc)
      from page pg
    ), '[]'::jsonb)
  );
$function$;

CREATE OR REPLACE FUNCTION public.fn_bulk_price_update(p_scope text, p_scope_value text, p_mode text, p_pct numeric, p_rounding text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_tenant_id uuid;
  v_product record;
  v_new_cost numeric;
  v_new_sale numeric;
  v_count integer := 0;
  v_margin_before_sum numeric := 0;
  v_margin_after_sum numeric := 0;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('catalog', 2) or not public.fn_can_see_cost() then
    raise exception 'not authorized';
  end if;
  if p_scope not in ('supplier', 'category', 'brand') then
    raise exception 'escopo inválido';
  end if;
  if p_mode not in ('cost', 'sale', 'margin') then
    raise exception 'modo de reajuste inválido';
  end if;
  if p_mode = 'margin' and p_pct >= 100 then
    raise exception 'margem alvo precisa ser menor que 100 por cento';
  end if;

  for v_product in
    select * from public.products p
    where p.tenant_id = v_tenant_id and p.active
      and (
        (p_scope = 'supplier' and p.supplier_id = p_scope_value::uuid)
        or (p_scope = 'category' and p.category_id = p_scope_value::uuid)
        or (p_scope = 'brand' and p.brand = p_scope_value)
      )
  loop
    if p_mode = 'cost' then
      v_new_cost := v_product.cost_price * (1 + p_pct / 100);
      v_new_sale := v_product.sale_price * (1 + p_pct / 100);
    elsif p_mode = 'sale' then
      v_new_cost := v_product.cost_price;
      v_new_sale := v_product.sale_price * (1 + p_pct / 100);
    else -- margin
      v_new_cost := v_product.cost_price;
      v_new_sale := case when p_pct < 100 then v_product.cost_price / (1 - p_pct / 100) else v_product.sale_price end;
    end if;

    v_new_sale := case p_rounding
      when '90' then floor(v_new_sale) + 0.90
      when '99' then floor(v_new_sale) + 0.99
      when '5' then round(v_new_sale / 5) * 5
      else round(v_new_sale, 2)
    end;

    if v_product.sale_price > 0 then
      v_margin_before_sum := v_margin_before_sum + ((v_product.sale_price - v_product.cost_price) / v_product.sale_price) * 100;
    end if;
    if v_new_sale > 0 then
      v_margin_after_sum := v_margin_after_sum + ((v_new_sale - v_new_cost) / v_new_sale) * 100;
    end if;

    update public.products set cost_price = v_new_cost, sale_price = v_new_sale where id = v_product.id;
    v_count := v_count + 1;
  end loop;

  if v_count > 0 then
    perform public.fn_write_audit(
      'price_bulk',
      format('Reajuste em lote de %s SKUs (%s, %s%%)', v_count, p_mode, p_pct),
      'bulk_price_update', null
    );
  end if;

  return jsonb_build_object(
    'count', v_count,
    'avg_margin_before', case when v_count > 0 then v_margin_before_sum / v_count else null end,
    'avg_margin_after', case when v_count > 0 then v_margin_after_sum / v_count else null end
  );
end;
$function$;


-- Colunas de custo fora do alcance de leitura direta (API/PostgREST).
revoke select on public.products from authenticated;
grant select (id, tenant_id, category_id, supplier_id, default_location_id, sku, barcode, brand, name, attrs, sale_price, min_stock, photo_url, notes, active, created_at) on public.products to authenticated;
revoke select on public.stock_movements from authenticated;
grant select (id, tenant_id, store_id, product_id, kind, qty, unit_price, before_qty, after_qty, reference_type, reference_id, reason, justification, created_by, created_at) on public.stock_movements to authenticated;
