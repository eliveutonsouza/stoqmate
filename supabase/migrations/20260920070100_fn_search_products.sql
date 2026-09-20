-- Fix: product-picker.jsx interpolava o termo de busca direto dentro da
-- string de filtro do PostgREST (`.or('sku.ilike.%'+term+'%,...')`) —
-- vírgula/ponto/parênteses no termo digitado alteram a sintaxe do filtro
-- (PostgREST Filter Injection, achado por revisão de segurança). RPC abaixo
-- recebe o termo como parâmetro ligado (bind), nunca concatenado em SQL/
-- filtro; `security invoker` (padrão) mantém RLS de products/categories/
-- stock_balances rodando com o papel de quem chamou, igual antes.
create or replace function public.fn_search_products(p_term text, p_limit integer default 8)
returns table (
  id uuid, sku text, barcode text, brand text, name text, attrs jsonb,
  sale_price numeric, cost_price numeric, min_stock integer,
  category jsonb, stock_balances jsonb
)
language sql
stable
set search_path = public
as $$
  select
    p.id, p.sku, p.barcode, p.brand, p.name, p.attrs, p.sale_price, p.cost_price, p.min_stock,
    (to_jsonb(c) - 'tenant_id') as category,
    coalesce(
      (select jsonb_agg(jsonb_build_object('store_id', sb.store_id, 'qty', sb.qty)) from public.stock_balances sb where sb.product_id = p.id),
      '[]'::jsonb
    ) as stock_balances
  from public.products p
  join public.categories c on c.id = p.category_id
  where p.sku ilike '%' || p_term || '%'
     or p.barcode ilike '%' || p_term || '%'
     or p.name ilike '%' || p_term || '%'
     or p.brand ilike '%' || p_term || '%'
  limit p_limit;
$$;

grant execute on function public.fn_search_products(text, integer) to authenticated;
