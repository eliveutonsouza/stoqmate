-- Créditos de IA no período de teste (auditoria, 27/09). Antes o cadastro
-- dava a cota cheia do plano escolhido já no trial (Rede = 3.500), e qualquer
-- conta nova "farmava" IA paga. Agora rede em trial recebe no máximo
-- platform_settings.trial_ai_credits (editável no console); a cota cheia
-- entra quando a assinatura fica paga (webhook do Stripe chama
-- fn_ai_apply_plan_change com a rede já 'active').
--
-- fn_ai_quota_for é a regra única: cadastro, renovação mensal e troca de
-- plano leem daqui. Rede criada pela equipe (fn_platform_create_tenant)
-- continua com a cota do plano — decisão de quem cria.

alter table public.platform_settings
  add column if not exists trial_ai_credits integer not null default 100
  check (trial_ai_credits between 0 and 100000);

create or replace function public.fn_ai_quota_for(p_plan_id text, p_status public.tenant_status)
returns integer
language sql stable security definer
set search_path = public
as $$
  select case when p_status = 'trial'
    then least(coalesce((select credits from public.plans where id = p_plan_id), 0),
               coalesce((select trial_ai_credits from public.platform_settings limit 1), 100))
    else coalesce((select credits from public.plans where id = p_plan_id), 0)
  end
$$;
revoke execute on function public.fn_ai_quota_for(text, public.tenant_status) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.fn_complete_signup(p_full_name text, p_store_name text, p_subdomain text, p_cnpj text DEFAULT NULL::text, p_plan_id text DEFAULT 'balcao'::text)
 RETURNS TABLE(new_tenant_id uuid, new_store_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  if coalesce(btrim(p_full_name), '') = '' or coalesce(btrim(p_store_name), '') = '' then
    raise exception 'nome e loja são obrigatórios';
  end if;

  if not exists (select 1 from public.plans where id = p_plan_id and active) then
    raise exception 'plano inválido';
  end if;
  -- Rede nasce em trial: cota do período de teste, não a do plano.
  v_initial_credits := public.fn_ai_quota_for(p_plan_id, 'trial');

  insert into public.tenants (name, subdomain, cnpj, plan_id, ai_credit_plan_balance, ai_credit_renews_at)
  values (p_store_name, p_subdomain, p_cnpj, p_plan_id, coalesce(v_initial_credits, 0), now() + interval '1 month')
  returning id into v_tenant_id;

  if v_initial_credits > 0 then
    insert into public.ai_credit_ledger (tenant_id, delta, balance_after, reason)
    values (v_tenant_id, v_initial_credits, v_initial_credits, 'Cota de IA do período de teste');
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
$function$;

CREATE OR REPLACE FUNCTION public.fn_ai_renew_cycle()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_tenant record;
  v_count integer := 0;
  v_plan_credits integer;
  v_next timestamptz;
begin
  for v_tenant in
    select id, plan_id, status, ai_credit_renews_at, ai_credit_extra_balance
    from public.tenants
    where ai_credit_renews_at <= now()
    for update skip locked
  loop
    v_plan_credits := public.fn_ai_quota_for(v_tenant.plan_id, v_tenant.status);

    v_next := v_tenant.ai_credit_renews_at;
    while v_next <= now() loop
      v_next := v_next + interval '1 month';
    end loop;

    update public.tenants
      set ai_credit_plan_balance = v_plan_credits,
          ai_credit_renews_at = v_next
      where id = v_tenant.id;

    insert into public.ai_credit_ledger (tenant_id, delta, balance_after, reason)
    values (v_tenant.id, v_plan_credits, v_plan_credits + v_tenant.ai_credit_extra_balance, 'Renovação mensal do plano');

    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$function$;

CREATE OR REPLACE FUNCTION public.fn_ai_apply_plan_change(p_tenant_id uuid, p_plan_id text, p_renews_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_credits integer;
  v_extra integer;
begin
  -- Troca de plano durante o trial (Stripe "trialing") respeita o teto.
  select public.fn_ai_quota_for(p_plan_id, status) into v_credits from public.tenants where id = p_tenant_id;
  v_credits := coalesce(v_credits, 0);

  select ai_credit_extra_balance into v_extra from public.tenants where id = p_tenant_id for update;

  update public.tenants
    set ai_credit_plan_balance = v_credits,
        ai_credit_renews_at = coalesce(p_renews_at, ai_credit_renews_at)
    where id = p_tenant_id;

  insert into public.ai_credit_ledger (tenant_id, delta, balance_after, reason)
  values (p_tenant_id, v_credits, v_credits + coalesce(v_extra, 0), 'Ajuste imediato de cota por troca de plano (' || p_plan_id || ')');
end;
$function$;

-- Console: teto editável. Assinatura nova (4 parâmetros); a de 3 sai numa
-- migration pós-deploy, quando o app já mandar o parâmetro novo.
create or replace function public.fn_platform_settings_update(
  p_trial_days integer, p_ai_spend_ceiling_usd numeric, p_ai_alert_pct integer, p_trial_ai_credits integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_platform_role('{super_admin}') then
    raise exception 'not authorized';
  end if;
  update public.platform_settings set
    trial_days = p_trial_days,
    ai_spend_ceiling_usd = p_ai_spend_ceiling_usd,
    ai_alert_pct = p_ai_alert_pct,
    trial_ai_credits = p_trial_ai_credits,
    updated_by = auth.uid(),
    updated_at = now()
  where id;
end;
$$;
revoke execute on function public.fn_platform_settings_update(integer, numeric, integer, integer) from public, anon;
grant execute on function public.fn_platform_settings_update(integer, numeric, integer, integer) to authenticated;
