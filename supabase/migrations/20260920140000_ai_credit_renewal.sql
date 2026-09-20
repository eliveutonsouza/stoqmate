-- Fase 7 (addendum) — renovação mensal de crédito de IA.
--
-- Decisões do desenvolvedor:
-- 1. Renovação segue o aniversário da assinatura (subscriptions.
--    current_period_end) pra quem paga, ou o aniversário do cadastro pra
--    quem está no plano free — mesma coluna (tenants.ai_credit_renews_at)
--    nos dois casos, só muda quem escreve nela.
-- 2. Cota do plano ZERA todo ciclo (não acumula). Crédito extra comprado
--    em pacote (tenants.ai_credit_extra_balance) nunca é tocado pela
--    renovação — é isso que faz a barra mostrar saldo acima do
--    contratado quando o lojista comprou pacote avulso.
-- 3. Troca de plano no meio do ciclo ajusta a cota na hora
--    (fn_ai_apply_plan_change, chamada pelo webhook do Stripe), sem
--    esperar o próximo ciclo do cron.
-- 4. Mecanismo é pg_cron diário no próprio Postgres, não o webhook do
--    Stripe — o webhook nunca dispara pra tenant sem assinatura (plano
--    free), então dependeria de dois caminhos de código pra "renovar
--    crédito". O cron cobre os dois casos com a mesma função.

alter table public.tenants
  add column ai_credit_plan_balance integer not null default 0,
  add column ai_credit_extra_balance integer not null default 0,
  add column ai_credit_renews_at timestamptz not null default (now() + interval '1 month');

update public.tenants set ai_credit_plan_balance = ai_credit_balance;

alter table public.tenants drop column ai_credit_balance;

-- fn_ai_debit_credits — debita do saldo do plano primeiro; só encosta no
-- extra quando o plano já zerou.
create or replace function public.fn_ai_debit_credits(p_op_id text)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_cost integer;
  v_plan integer;
  v_extra integer;
  v_from_plan integer;
  v_from_extra integer;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('ai', 1) then
    raise exception 'not authorized';
  end if;

  select credits into v_cost from public.ai_ops where id = p_op_id;
  if v_cost is null then
    raise exception 'operação de IA inválida';
  end if;

  select ai_credit_plan_balance, ai_credit_extra_balance into v_plan, v_extra
    from public.tenants where id = v_tenant_id for update;
  if v_plan + v_extra < v_cost then
    raise exception 'saldo de créditos de IA insuficiente';
  end if;

  v_from_plan := least(v_plan, v_cost);
  v_from_extra := v_cost - v_from_plan;

  update public.tenants
    set ai_credit_plan_balance = v_plan - v_from_plan,
        ai_credit_extra_balance = v_extra - v_from_extra
    where id = v_tenant_id;

  insert into public.ai_credit_ledger (tenant_id, delta, balance_after, reason)
  values (v_tenant_id, -v_cost, (v_plan - v_from_plan) + (v_extra - v_from_extra), 'Uso: ' || p_op_id);

  return (v_plan - v_from_plan) + (v_extra - v_from_extra);
end;
$$;

-- fn_ai_refund_credits — estorno sempre volta pro saldo do plano (é de lá
-- que o débito sai primeiro). Se o plano já estava zerado quando debitou,
-- o estorno vira folga a mais no plano em vez de tentar reconstruir a
-- proporção original — aceitável porque estorno é evento raro (falha da
-- chamada à IA), não caminho comum.
create or replace function public.fn_ai_refund_credits(p_op_id text)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_cost integer;
  v_plan integer;
  v_extra integer;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null then
    raise exception 'not authorized';
  end if;

  select credits into v_cost from public.ai_ops where id = p_op_id;
  if v_cost is null then
    raise exception 'operação de IA inválida';
  end if;

  select ai_credit_plan_balance, ai_credit_extra_balance into v_plan, v_extra
    from public.tenants where id = v_tenant_id for update;

  update public.tenants set ai_credit_plan_balance = v_plan + v_cost where id = v_tenant_id;

  insert into public.ai_credit_ledger (tenant_id, delta, balance_after, reason)
  values (v_tenant_id, v_cost, (v_plan + v_cost) + v_extra, 'Estorno: falha em ' || p_op_id);

  return (v_plan + v_cost) + v_extra;
end;
$$;

-- fn_complete_signup — grava a cota inicial no saldo do plano e já marca
-- a primeira renovação pra daqui a 1 mês (tenant free não tem
-- current_period_end de assinatura pra usar como âncora).
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

  return query select v_tenant_id, v_store_id;
end;
$$;

-- fn_ai_renew_cycle — chamada pelo cron diário. Renova todo tenant cuja
-- data de renovação já passou: zera e recoloca a cota do plano (nunca
-- acumula), avança ai_credit_renews_at pro próximo ciclo (em loop, pro
-- caso raro do cron ter ficado parado por mais de 1 mês). Não toca no
-- saldo extra.
create function public.fn_ai_renew_cycle()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant record;
  v_count integer := 0;
  v_plan_credits integer;
  v_next timestamptz;
begin
  for v_tenant in
    select id, plan_id, ai_credit_renews_at, ai_credit_extra_balance
    from public.tenants
    where ai_credit_renews_at <= now()
    for update skip locked
  loop
    select credits into v_plan_credits from public.plans where id = v_tenant.plan_id;
    v_plan_credits := coalesce(v_plan_credits, 0);

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
$$;

-- fn_ai_apply_plan_change — chamada só pelo webhook do Stripe
-- (service_role) quando a assinatura troca de plano: ajusta a cota na
-- hora e realinha a data de renovação com o ciclo real da assinatura, sem
-- esperar o cron. NUNCA conceder execute pra `authenticated` — recebe
-- p_tenant_id explícito, então virar chamável pelo cliente seria brecha
-- cross-tenant.
create function public.fn_ai_apply_plan_change(p_tenant_id uuid, p_plan_id text, p_renews_at timestamptz default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credits integer;
  v_extra integer;
begin
  select credits into v_credits from public.plans where id = p_plan_id;
  v_credits := coalesce(v_credits, 0);

  select ai_credit_extra_balance into v_extra from public.tenants where id = p_tenant_id for update;

  update public.tenants
    set ai_credit_plan_balance = v_credits,
        ai_credit_renews_at = coalesce(p_renews_at, ai_credit_renews_at)
    where id = p_tenant_id;

  insert into public.ai_credit_ledger (tenant_id, delta, balance_after, reason)
  values (p_tenant_id, v_credits, v_credits + coalesce(v_extra, 0), 'Ajuste imediato de cota por troca de plano (' || p_plan_id || ')');
end;
$$;

grant execute on function public.fn_ai_renew_cycle() to service_role;
grant execute on function public.fn_ai_apply_plan_change(uuid, text, timestamptz) to service_role;

-- Cron diário — pg_cron já vem disponível no Supabase; agenda roda dentro
-- do próprio Postgres, sem depender de nenhum processo externo.
create extension if not exists pg_cron;

select cron.schedule(
  'ai-credit-renewal-daily',
  '17 3 * * *',
  $$select public.fn_ai_renew_cycle();$$
);
