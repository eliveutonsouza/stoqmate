-- Custo unitário de movimentações em lote (telas de histórico/exportação),
-- mesma regra de fn_product_costs: só perfis com a área "money".
create or replace function public.fn_movement_costs(p_movement_ids uuid[])
returns table (movement_id uuid, unit_cost numeric)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.unit_cost from public.stock_movements m
  where m.id = any(coalesce(p_movement_ids, '{}')) and m.tenant_id = public.auth_tenant_id() and public.has_access('money', 1);
$$;
revoke execute on function public.fn_movement_costs(uuid[]) from public, anon;
grant execute on function public.fn_movement_costs(uuid[]) to authenticated;
