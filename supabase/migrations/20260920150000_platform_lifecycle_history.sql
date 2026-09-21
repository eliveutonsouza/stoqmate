-- Fecha as pendências de métricas históricas da plataforma (admin-reports:
-- coorte/churn; dashboard admin: spark de MRR) e de criação de rede pelo
-- console admin. Decisão do desenvolvedor: construir o tracking histórico
-- completo agora, mesmo sabendo que ele começa vazio — o log só existe a
-- partir de hoje, não há como reconstruir o que nunca foi gravado. Um
-- evento de backfill dá o primeiro ponto de dado real (created_at de cada
-- tenant já é fato, não invenção).

create table public.tenant_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  event_type text not null check (event_type in ('signup', 'plan_change', 'canceled', 'reactivated')),
  from_plan_id text references public.plans(id),
  to_plan_id text references public.plans(id),
  occurred_at timestamptz not null default now()
);
create index tenant_lifecycle_events_tenant_id_idx on public.tenant_lifecycle_events (tenant_id);
create index tenant_lifecycle_events_occurred_at_idx on public.tenant_lifecycle_events (occurred_at);

insert into public.tenant_lifecycle_events (tenant_id, event_type, to_plan_id, occurred_at)
select id, 'signup', plan_id, created_at from public.tenants;

alter table public.tenant_lifecycle_events enable row level security;
create policy tenant_lifecycle_events_staff_select on public.tenant_lifecycle_events
  for select to authenticated using (public.is_platform_staff());
grant select on public.tenant_lifecycle_events to authenticated;

-- Campos que o formulário de rede do admin já pedia mas tenants não
-- guardava: razão social, segmento, cidade, estado. profiles.phone já
-- existia.
alter table public.tenants
  add column legal_name text,
  add column segment text,
  add column city text,
  add column state text;

alter table public.ai_usage_log add column latency_ms integer;

-- fn_write_ai_usage — recriada só pra aceitar o novo p_latency_ms
-- (default null pra não quebrar nenhuma chamada antiga).
create or replace function public.fn_write_ai_usage(
  p_op_id text, p_model text, p_tokens_in integer, p_tokens_out integer,
  p_cost_usd numeric, p_status text, p_error_message text default null,
  p_latency_ms integer default null
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null then
    raise exception 'not authorized';
  end if;
  insert into public.ai_usage_log (tenant_id, op_id, model, tokens_in, tokens_out, cost_usd, status, error_message, latency_ms, created_by)
  values (v_tenant_id, p_op_id, p_model, p_tokens_in, p_tokens_out, p_cost_usd, p_status, p_error_message, p_latency_ms, auth.uid());
end;
$$;

-- fn_platform_create_tenant — staff cria uma rede em nome de outra pessoa.
-- fn_complete_signup não serve aqui: ele exige auth.uid() de uma sessão de
-- verdade do próprio dono, e quem está logado é o staff, não o dono.
create function public.fn_platform_create_tenant(
  p_name text, p_subdomain text, p_cnpj text, p_plan_id text,
  p_legal_name text, p_segment text, p_city text, p_state text,
  p_owner_user_id uuid, p_owner_full_name text
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_initial_credits integer;
begin
  if not public.is_platform_staff() then
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
$$;
grant execute on function public.fn_platform_create_tenant(text, text, text, text, text, text, text, text, uuid, text) to authenticated;

-- fn_platform_update_tenant — edição pelo console admin. Troca de plano
-- também grava o evento de ciclo de vida e ajusta a cota de IA na hora
-- (reaproveita fn_ai_apply_plan_change, que continua sem grant direto pra
-- authenticated — só é chamável de dentro de outra função já gateada).
create function public.fn_platform_update_tenant(
  p_tenant_id uuid, p_name text, p_cnpj text, p_plan_id text, p_status text,
  p_legal_name text, p_segment text, p_city text, p_state text
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_old_plan_id text;
begin
  if not public.is_platform_staff() then
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
$$;
grant execute on function public.fn_platform_update_tenant(uuid, text, text, text, text, text, text, text, text) to authenticated;

-- fn_platform_mrr_trend — MRR mês a mês, derivado do log de eventos.
-- Simplificação assumida: usa sempre monthly_price (ciclo anual não é
-- reconstruível a partir do log de eventos hoje) — o MRR "atual" exibido
-- em admin-subscriptions continua vindo de subscriptions.cycle de verdade,
-- só o spark histórico usa essa aproximação.
create function public.fn_platform_mrr_trend(p_months integer default 12)
returns table (month date, mrr numeric)
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_platform_staff() then
    raise exception 'not authorized';
  end if;

  return query
  with months as (
    select (date_trunc('month', now()) - (n || ' months')::interval)::date as month
    from generate_series(0, p_months - 1) as n
  )
  select
    m.month,
    coalesce((
      select sum(p.monthly_price)
      from public.tenants t
      join lateral (
        select e.event_type, e.to_plan_id
        from public.tenant_lifecycle_events e
        where e.tenant_id = t.id and e.occurred_at <= (m.month + interval '1 month' - interval '1 second')
        order by e.occurred_at desc
        limit 1
      ) last_event on true
      join public.plans p on p.id = last_event.to_plan_id
      where last_event.event_type <> 'canceled'
    ), 0) as mrr
  from months m
  order by m.month;
end;
$$;
grant execute on function public.fn_platform_mrr_trend(integer) to authenticated;

-- fn_platform_cohort_retention — % de tenants de cada coorte mensal ainda
-- ativos N meses depois. Célula fica NULL (não 100%) quando esse mês
-- ainda não aconteceu de verdade pra aquela coorte — mostrar 100% pra um
-- período que não chegou seria inventar dado.
create function public.fn_platform_cohort_retention()
returns table (cohort_month date, tenants_count integer, m0 numeric, m1 numeric, m2 numeric, m3 numeric, m4 numeric, m5 numeric)
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_platform_staff() then
    raise exception 'not authorized';
  end if;

  return query
  with cohorts as (
    select tenant_id, date_trunc('month', min(occurred_at))::date as cohort_month
    from public.tenant_lifecycle_events
    where event_type = 'signup'
    group by tenant_id
  ),
  churn as (
    select tenant_id, min(occurred_at) as canceled_at
    from public.tenant_lifecycle_events
    where event_type = 'canceled'
    group by tenant_id
  )
  select
    c.cohort_month,
    count(*)::integer,
    case when now() >= c.cohort_month + interval '1 month' then round(100.0 * count(*) filter (where ch.canceled_at is null or ch.canceled_at > c.cohort_month + interval '1 month') / count(*), 1) end,
    case when now() >= c.cohort_month + interval '2 months' then round(100.0 * count(*) filter (where ch.canceled_at is null or ch.canceled_at > c.cohort_month + interval '2 months') / count(*), 1) end,
    case when now() >= c.cohort_month + interval '3 months' then round(100.0 * count(*) filter (where ch.canceled_at is null or ch.canceled_at > c.cohort_month + interval '3 months') / count(*), 1) end,
    case when now() >= c.cohort_month + interval '4 months' then round(100.0 * count(*) filter (where ch.canceled_at is null or ch.canceled_at > c.cohort_month + interval '4 months') / count(*), 1) end,
    case when now() >= c.cohort_month + interval '5 months' then round(100.0 * count(*) filter (where ch.canceled_at is null or ch.canceled_at > c.cohort_month + interval '5 months') / count(*), 1) end,
    case when now() >= c.cohort_month + interval '6 months' then round(100.0 * count(*) filter (where ch.canceled_at is null or ch.canceled_at > c.cohort_month + interval '6 months') / count(*), 1) end
  from cohorts c
  left join churn ch on ch.tenant_id = c.tenant_id
  group by c.cohort_month
  order by c.cohort_month;
end;
$$;
grant execute on function public.fn_platform_cohort_retention() to authenticated;

-- fn_platform_growth_by_month — signups vs cancelamentos por mês.
create function public.fn_platform_growth_by_month(p_months integer default 12)
returns table (month date, new_tenants integer, canceled_tenants integer)
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_platform_staff() then
    raise exception 'not authorized';
  end if;

  return query
  with months as (
    select (date_trunc('month', now()) - (n || ' months')::interval)::date as month
    from generate_series(0, p_months - 1) as n
  )
  select
    m.month,
    (select count(*) from public.tenant_lifecycle_events e where e.event_type = 'signup' and date_trunc('month', e.occurred_at) = m.month)::integer,
    (select count(*) from public.tenant_lifecycle_events e where e.event_type = 'canceled' and date_trunc('month', e.occurred_at) = m.month)::integer
  from months m
  order by m.month;
end;
$$;
grant execute on function public.fn_platform_growth_by_month(integer) to authenticated;
