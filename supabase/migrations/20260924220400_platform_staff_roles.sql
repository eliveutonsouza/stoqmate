-- Papéis do staff passam a valer no banco (antes qualquer staff, inclusive
-- comercial/engenharia, editava planos, configurações e redes).
-- Planos e configurações globais: só super_admin. Criar/editar rede:
-- super_admin ou suporte. Leituras continuam liberadas pra todo staff.

create or replace function public.has_platform_role(p_roles public.platform_role[])
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_platform_staff() and exists (
    select 1 from public.platform_staff where user_id = auth.uid() and role = any(p_roles)
  )
$$;
revoke execute on function public.has_platform_role(public.platform_role[]) from public, anon;
grant execute on function public.has_platform_role(public.platform_role[]) to authenticated;


CREATE OR REPLACE FUNCTION public.fn_platform_plan_upsert(p_id text, p_name text, p_tagline text, p_who text, p_monthly_price numeric, p_yearly_price numeric, p_credits integer, p_limits jsonb, p_popular boolean, p_active boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.has_platform_role('{super_admin}') then
    raise exception 'not authorized';
  end if;
  insert into public.plans (id, name, tagline, who, monthly_price, yearly_price, credits, limits, popular, active)
  values (p_id, p_name, p_tagline, p_who, p_monthly_price, p_yearly_price, p_credits, p_limits, p_popular, p_active)
  on conflict (id) do update set
    name = excluded.name, tagline = excluded.tagline, who = excluded.who,
    monthly_price = excluded.monthly_price, yearly_price = excluded.yearly_price,
    credits = excluded.credits, limits = excluded.limits, popular = excluded.popular, active = excluded.active;
end;
$function$;

CREATE OR REPLACE FUNCTION public.fn_platform_settings_update(p_trial_days integer, p_ai_spend_ceiling_usd numeric, p_ai_alert_pct integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.has_platform_role('{super_admin}') then
    raise exception 'not authorized';
  end if;
  update public.platform_settings set
    trial_days = p_trial_days,
    ai_spend_ceiling_usd = p_ai_spend_ceiling_usd,
    ai_alert_pct = p_ai_alert_pct,
    updated_by = auth.uid(),
    updated_at = now()
  where id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.fn_platform_create_tenant(p_name text, p_subdomain text, p_cnpj text, p_plan_id text, p_legal_name text, p_segment text, p_city text, p_state text, p_owner_user_id uuid, p_owner_full_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_tenant_id uuid;
  v_initial_credits integer;
begin
  if not public.has_platform_role('{super_admin,suporte}') then
    raise exception 'not authorized';
  end if;

  select credits into v_initial_credits from public.plans where id = p_plan_id;

  insert into public.tenants (name, subdomain, cnpj, plan_id, legal_name, segment, city, state, ai_credit_plan_balance, ai_credit_renews_at)
  values (p_name, p_subdomain, p_cnpj, p_plan_id, p_legal_name, p_segment, p_city, p_state, coalesce(v_initial_credits, 0), now() + interval '1 month')
  returning id into v_tenant_id;

  if v_initial_credits > 0 then
    insert into public.ai_credit_ledger (tenant_id, delta, balance_after, reason)
    values (v_tenant_id, v_initial_credits, v_initial_credits, 'Cota inicial do plano — rede criada pelo console admin');
  end if;

  insert into public.stores (tenant_id, name, type, city)
  values (v_tenant_id, p_name, 'loja', p_city);

  insert into public.profiles (id, tenant_id, full_name)
  values (p_owner_user_id, v_tenant_id, p_owner_full_name)
  on conflict (id) do update set tenant_id = excluded.tenant_id, full_name = excluded.full_name;

  insert into public.store_users (tenant_id, user_id, role, status)
  values (v_tenant_id, p_owner_user_id, 'proprietario', 'active');

  insert into public.tenant_lifecycle_events (tenant_id, event_type, to_plan_id)
  values (v_tenant_id, 'signup', p_plan_id);

  return v_tenant_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.fn_platform_update_tenant(p_tenant_id uuid, p_name text, p_cnpj text, p_plan_id text, p_status text, p_legal_name text, p_segment text, p_city text, p_state text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_old_plan_id text;
begin
  if not public.has_platform_role('{super_admin,suporte}') then
    raise exception 'not authorized';
  end if;

  select plan_id into v_old_plan_id from public.tenants where id = p_tenant_id;
  if v_old_plan_id is null then
    raise exception 'rede não encontrada';
  end if;

  update public.tenants set
    name = p_name, cnpj = p_cnpj, plan_id = p_plan_id, status = p_status::tenant_status,
    legal_name = p_legal_name, segment = p_segment, city = p_city, state = p_state
  where id = p_tenant_id;

  if v_old_plan_id is distinct from p_plan_id then
    insert into public.tenant_lifecycle_events (tenant_id, event_type, from_plan_id, to_plan_id)
    values (p_tenant_id, 'plan_change', v_old_plan_id, p_plan_id);
    perform public.fn_ai_apply_plan_change(p_tenant_id, p_plan_id, null);
  end if;
end;
$function$;
