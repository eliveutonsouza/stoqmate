-- fn_complete_signup passa a gravar o evento de lifecycle também pra
-- signup orgânico (autosserviço) — a migration anterior só fez o backfill
-- dos tenants que já existiam; sem isso, todo tenant novo criado a partir
-- de agora pelo próprio fluxo de cadastro ficaria fora do log de eventos
-- que admin-reports/dashboard usam.
create or replace function public.fn_complete_signup(
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
  v_initial_credits integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid() and tenant_id is not null) then
    raise exception 'user already has a tenant';
  end if;

  select credits into v_initial_credits from public.plans where id = p_plan_id;

  insert into public.tenants (name, subdomain, cnpj, plan_id, ai_credit_plan_balance, ai_credit_renews_at)
  values (p_store_name, p_subdomain, p_cnpj, p_plan_id, coalesce(v_initial_credits, 0), now() + interval '1 month')
  returning id into v_tenant_id;

  if v_initial_credits > 0 then
    insert into public.ai_credit_ledger (tenant_id, delta, balance_after, reason)
    values (v_tenant_id, v_initial_credits, v_initial_credits, 'Cota inicial do plano no cadastro');
  end if;

  insert into public.stores (tenant_id, name, type)
  values (v_tenant_id, p_store_name, 'loja')
  returning id into v_store_id;

  insert into public.profiles (id, tenant_id, full_name)
  values (auth.uid(), v_tenant_id, p_full_name)
  on conflict (id) do update set tenant_id = excluded.tenant_id, full_name = excluded.full_name;

  insert into public.store_users (tenant_id, user_id, role, status)
  values (v_tenant_id, auth.uid(), 'proprietario', 'active');

  insert into public.tenant_lifecycle_events (tenant_id, event_type, to_plan_id)
  values (v_tenant_id, 'signup', p_plan_id);

  return query select v_tenant_id, v_store_id;
end;
$$;
