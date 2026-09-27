-- Console admin: uso por rede e gasto de IA agregados no banco. Antes a tela
-- baixava todas as linhas de products/stock_movements/ai_usage_log e contava
-- no servidor — o PostgREST corta em 1000 linhas, então os números paravam
-- de crescer em silêncio quando a base passava disso.

create or replace function public.fn_platform_tenant_usage()
returns table (tenant_id uuid, skus bigint, movements_30d bigint, users bigint)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_platform_staff() then
    raise exception 'not authorized';
  end if;
  return query
  select t.id,
    (select count(*) from public.products p where p.tenant_id = t.id),
    (select count(*) from public.stock_movements m where m.tenant_id = t.id and m.created_at >= now() - interval '30 days'),
    (select count(*) from public.store_users su where su.tenant_id = t.id)
  from public.tenants t;
end;
$$;

create or replace function public.fn_platform_ai_spend(p_since timestamptz)
returns numeric
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_platform_staff() then
    raise exception 'not authorized';
  end if;
  return coalesce((select sum(cost_usd) from public.ai_usage_log where created_at >= p_since), 0);
end;
$$;

revoke execute on function public.fn_platform_tenant_usage() from public, anon;
revoke execute on function public.fn_platform_ai_spend(timestamptz) from public, anon;
grant execute on function public.fn_platform_tenant_usage() to authenticated;
grant execute on function public.fn_platform_ai_spend(timestamptz) to authenticated;
