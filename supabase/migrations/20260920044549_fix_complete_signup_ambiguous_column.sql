-- Fix: `returns table (tenant_id uuid, store_id uuid)` cria parâmetros OUT
-- com esse nome, que colidem com a coluna `tenant_id` das tabelas usadas
-- dentro da função — plpgsql (#variable_conflict error, o padrão) recusa
-- a ambiguidade em vez de adivinhar: "column reference tenant_id is
-- ambiguous". Renomeia os OUT params pra não colidir com nome de coluna
-- nenhuma.

drop function if exists public.fn_complete_signup(text, text, text, text, text);

create function public.fn_complete_signup(
  p_full_name text,
  p_store_name text,
  p_subdomain text,
  p_cnpj text default null,
  p_plan_id text default 'balcao'
)
returns table (new_tenant_id uuid, new_store_id uuid)
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_store_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid() and tenant_id is not null) then
    raise exception 'user already has a tenant';
  end if;

  insert into public.tenants (name, subdomain, cnpj, plan_id)
  values (p_store_name, p_subdomain, p_cnpj, p_plan_id)
  returning id into v_tenant_id;

  insert into public.stores (tenant_id, name, type)
  values (v_tenant_id, p_store_name, 'loja')
  returning id into v_store_id;

  insert into public.profiles (id, tenant_id, full_name)
  values (auth.uid(), v_tenant_id, p_full_name)
  on conflict (id) do update set tenant_id = excluded.tenant_id, full_name = excluded.full_name;

  insert into public.store_users (tenant_id, user_id, role, status)
  values (v_tenant_id, auth.uid(), 'proprietario', 'active');

  return query select v_tenant_id, v_store_id;
end;
$$;

grant execute on function public.fn_complete_signup(text, text, text, text, text) to authenticated;
