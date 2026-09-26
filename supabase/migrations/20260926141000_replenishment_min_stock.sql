-- A tela promete sugestão por "venda dos últimos 30 dias, estoque mínimo e
-- prazo", mas o mínimo não entrava na conta: produto parado abaixo do mínimo
-- nunca era sugerido. Agora a sugestão é no mínimo o que falta pro mínimo.
create or replace function public.fn_replenishment_suggestions(p_store_id uuid)
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
    greatest(
      0,
      ceil((coalesce(sold.qty, 0)::numeric / 30) * (coalesce(s.lead_time_days, 0) + 30) - coalesce(sb.qty, 0)),
      p.min_stock - coalesce(sb.qty, 0)
    )::integer as suggest_qty
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
