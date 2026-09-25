-- ============================================================
-- Listas com busca, filtro e paginação no servidor.
--
-- Antes: a busca das listas (produtos, clientes, fornecedores, histórico
-- de estoque) não fazia nada, os filtros eram decorativos e a lista vinha
-- inteira (cortada em silêncio em 1000 linhas pelo max_rows do PostgREST,
-- ou em 100 no histórico).
--
-- Por que RPC e não PostgREST direto:
-- - busca em várias colunas precisa de OR; montar `.or()` com texto do
--   usuário é PostgREST filter injection (mesmo achado de
--   fn_search_products). Aqui o termo entra como parâmetro ligado e o
--   curinga do LIKE (% e _) é escapado em fn_like_escape.
-- - filtro por estoque depende da SOMA de stock_balances por produto, que
--   o PostgREST não filtra.
-- Todas `security invoker`: RLS das tabelas lidas continua isolando o
-- tenant, igual fn_sales_report / fn_stock_overview.
-- Paginação: p_limit/p_offset; `total` é a contagem exata do filtro.
-- ============================================================

create or replace function public.fn_like_escape(p text)
returns text
language sql
immutable
set search_path = public
as $$
  select replace(replace(replace(coalesce(p, ''), '\', '\\'), '%', '\%'), '_', '\_');
$$;

-- ------------------------------------------------------------
-- Produtos
-- p_stock: 'in' (saldo > 0) | 'low' (abaixo do mínimo, mínimo > 0) |
--          'out' (saldo <= 0) | null
-- ------------------------------------------------------------
create or replace function public.fn_products_list(
  p_term text default null,
  p_category_id uuid default null,
  p_brand text default null,
  p_stock text default null,
  p_location_id uuid default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language sql
stable
set search_path = public
as $$
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
    select p.*, coalesce(b.qty, 0)::bigint as stock
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
$$;

-- Facetas do catálogo inteiro (não dependem do filtro): total de SKUs,
-- contagem por categoria (abas) e marcas distintas (chip "Marca").
create or replace function public.fn_products_facets()
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'total', (select count(*) from public.products),
    'by_category', coalesce((
      select jsonb_agg(jsonb_build_object('category_id', category_id, 'count', n))
      from (select category_id, count(*) as n from public.products group by category_id) x
    ), '[]'::jsonb),
    'brands', coalesce((
      select jsonb_agg(brand order by brand)
      from (select distinct brand from public.products where brand is not null and btrim(brand) <> '') x
    ), '[]'::jsonb)
  );
$$;

-- ------------------------------------------------------------
-- Clientes — busca em nome, documento, telefone, email (documento e
-- telefone também só pelos dígitos, pra "11987" achar "(11) 98765-…").
-- Totais dos KPIs são da base inteira, não da página.
-- ------------------------------------------------------------
create or replace function public.fn_customers_list(
  p_term text default null,
  p_with_credit boolean default false,
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language sql
stable
set search_path = public
as $$
  with params as (
    select nullif(btrim(coalesce(p_term, '')), '') as term,
      regexp_replace(coalesce(p_term, ''), '\D', '', 'g') as digits
  ),
  pat as (
    select case when term is null then null else '%' || public.fn_like_escape(term) || '%' end as like_pat,
      case when length(digits) >= 3 then '%' || digits || '%' else null end as digit_pat
    from params
  ),
  base as (
    select c.id, c.name, c.doc, c.phone, c.email, c.credit_balance, c.created_at,
      coalesce(cs.purchases_count, 0) as purchases_count,
      coalesce(cs.total_spent, 0) as total_spent,
      cs.last_purchase_at
    from public.customers c
    left join public.customer_stats cs on cs.customer_id = c.id
  ),
  filtered as (
    select base.* from base, pat
    where (pat.like_pat is null
        or base.name ilike pat.like_pat
        or base.doc ilike pat.like_pat
        or base.phone ilike pat.like_pat
        or base.email ilike pat.like_pat
        or (pat.digit_pat is not null and regexp_replace(coalesce(base.doc, ''), '\D', '', 'g') like pat.digit_pat)
        or (pat.digit_pat is not null and regexp_replace(coalesce(base.phone, ''), '\D', '', 'g') like pat.digit_pat))
      and (not coalesce(p_with_credit, false) or base.credit_balance > 0)
  ),
  page as (
    select * from filtered
    order by name, id
    limit greatest(coalesce(p_limit, 50), 0) offset greatest(coalesce(p_offset, 0), 0)
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'catalog_total', (select count(*) from base),
    'total_spent', (select coalesce(sum(total_spent), 0) from base),
    'credit_total', (select coalesce(sum(credit_balance), 0) from base where credit_balance > 0),
    'credit_count', (select count(*) from base where credit_balance > 0),
    'rows', coalesce((select jsonb_agg(to_jsonb(pg) order by pg.name, pg.id) from page pg), '[]'::jsonb)
  );
$$;

-- ------------------------------------------------------------
-- Fornecedores — busca em nome, CNPJ (também só dígitos), email e marcas.
-- p_lead: 'short' (até 7 dias) | 'medium' (8–15) | 'long' (> 15) |
--         'none' (sem prazo informado) | null
-- ------------------------------------------------------------
create or replace function public.fn_suppliers_list(
  p_term text default null,
  p_category_id uuid default null,
  p_lead text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language sql
stable
set search_path = public
as $$
  with params as (
    select nullif(btrim(coalesce(p_term, '')), '') as term,
      regexp_replace(coalesce(p_term, ''), '\D', '', 'g') as digits
  ),
  pat as (
    select case when term is null then null else '%' || public.fn_like_escape(term) || '%' end as like_pat,
      case when length(digits) >= 3 then '%' || digits || '%' else null end as digit_pat
    from params
  ),
  filtered as (
    select s.* from public.suppliers s, pat
    where (pat.like_pat is null
        or s.name ilike pat.like_pat
        or s.cnpj ilike pat.like_pat
        or s.order_email ilike pat.like_pat
        or array_to_string(s.brands, ' ') ilike pat.like_pat
        or (pat.digit_pat is not null and regexp_replace(coalesce(s.cnpj, ''), '\D', '', 'g') like pat.digit_pat))
      and (p_category_id is null or exists (
        select 1 from public.supplier_categories sc where sc.supplier_id = s.id and sc.category_id = p_category_id))
      and (p_lead is null
        or (p_lead = 'short' and s.lead_time_days <= 7)
        or (p_lead = 'medium' and s.lead_time_days between 8 and 15)
        or (p_lead = 'long' and s.lead_time_days > 15)
        or (p_lead = 'none' and s.lead_time_days is null))
  ),
  page as (
    select * from filtered
    order by name, id
    limit greatest(coalesce(p_limit, 50), 0) offset greatest(coalesce(p_offset, 0), 0)
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'catalog_total', (select count(*) from public.suppliers),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pg.id, 'name', pg.name, 'cnpj', pg.cnpj, 'phone', pg.phone, 'order_email', pg.order_email,
        'brands', pg.brands, 'lead_time_days', pg.lead_time_days, 'active', pg.active,
        'cats', coalesce((
          select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'icon', c.icon, 'color', c.color) order by c.name)
          from public.supplier_categories sc join public.categories c on c.id = sc.category_id
          where sc.supplier_id = pg.id
        ), '[]'::jsonb)
      ) order by pg.name, pg.id)
      from page pg
    ), '[]'::jsonb)
  );
$$;

-- ------------------------------------------------------------
-- Histórico de movimentações — busca por SKU/código de barras/nome do
-- produto, filtro por tipo e por loja. `kinds` conta por tipo dentro do
-- filtro de busca/loja (abas); os KPIs somam o filtro completo.
-- ------------------------------------------------------------
create or replace function public.fn_stock_movements_list(
  p_term text default null,
  p_kind text default null,
  p_store_id uuid default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language sql
stable
set search_path = public
as $$
  with params as (
    select nullif(btrim(coalesce(p_term, '')), '') as term
  ),
  pat as (
    select case when term is null then null else '%' || public.fn_like_escape(term) || '%' end as like_pat from params
  ),
  scoped as (
    select m.*, p.sku as p_sku, p.name as p_name, p.category_id as p_category_id
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
$$;

revoke execute on function public.fn_like_escape(text) from public, anon;
revoke execute on function public.fn_products_list(text, uuid, text, text, uuid, integer, integer) from public, anon;
revoke execute on function public.fn_products_facets() from public, anon;
revoke execute on function public.fn_customers_list(text, boolean, integer, integer) from public, anon;
revoke execute on function public.fn_suppliers_list(text, uuid, text, integer, integer) from public, anon;
revoke execute on function public.fn_stock_movements_list(text, text, uuid, integer, integer) from public, anon;

grant execute on function public.fn_like_escape(text) to authenticated;
grant execute on function public.fn_products_list(text, uuid, text, text, uuid, integer, integer) to authenticated;
grant execute on function public.fn_products_facets() to authenticated;
grant execute on function public.fn_customers_list(text, boolean, integer, integer) to authenticated;
grant execute on function public.fn_suppliers_list(text, uuid, text, integer, integer) to authenticated;
grant execute on function public.fn_stock_movements_list(text, text, uuid, integer, integer) to authenticated;
