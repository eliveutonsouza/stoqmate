-- ============================================================
-- fn_create_store — /settings/units saía do mock (UNITS estático, modal
-- "Adicionar unidade" fechava sem criar nada). Mesmo gate de assento por
-- plano já usado em fn_team_invite (limits.stores), mesmo nível de acesso
-- de fn_platform_create_tenant/stores_write (has_access('people', 3)).
-- ============================================================

create function public.fn_create_store(p_name text, p_type text, p_city text, p_cnpj text default null)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_limit integer;
  v_used integer;
  v_store_id uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('people', 3) then
    raise exception 'not authorized';
  end if;
  if length(trim(p_name)) < 2 then
    raise exception 'nome da unidade muito curto';
  end if;
  if p_type not in ('loja', 'cd', 'quiosque', 'estoque_externo') then
    raise exception 'tipo de unidade inválido';
  end if;

  select coalesce((pl.limits->>'stores')::integer, 0) into v_limit
  from public.tenants t join public.plans pl on pl.id = t.plan_id
  where t.id = v_tenant_id;

  if v_limit > 0 then
    select count(*) into v_used from public.stores where tenant_id = v_tenant_id and type = 'loja';
    if p_type = 'loja' and v_used >= v_limit then
      raise exception 'Seu plano permite % lojas. Faça upgrade para adicionar mais.', v_limit;
    end if;
  end if;

  insert into public.stores (tenant_id, name, type, city, cnpj)
  values (v_tenant_id, p_name, p_type::public.store_type, p_city, nullif(p_cnpj, ''))
  returning id into v_store_id;

  perform public.fn_write_audit('store.create', 'Criou a unidade "' || p_name || '"', 'store', v_store_id);

  return v_store_id;
end;
$$;

grant execute on function public.fn_create_store(text, text, text, text) to authenticated;
