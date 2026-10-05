-- Auditoria de production readiness (2026-10-05).
--
-- 1. 2FA do lojista valia só no perfil: o login aceitava só senha e o JWT
--    aal1 lia/escrevia tudo direto via PostgREST (a anon key é pública).
--    auth_tenant_id() agora devolve null quando o usuário tem fator TOTP
--    verificado e a sessão não é aal2 — toda policy e toda função
--    security definer já partem de auth_tenant_id(), então o bloqueio vale
--    em todo lugar de uma vez. fn_session_context devolve 'mfa_required'
--    pro proxy mandar pro passo do código.
-- 2. Paywall só existia no proxy: conta com trial vencido, cancelada ou
--    sem pagamento seguia escrevendo via Server Action/PostgREST.
--    has_access(area, >= 2) agora exige conta liberada, exceto nas áreas que
--    a conta bloqueada precisa (account, billing, company). Leitura (nível
--    1) continua — as telas de cobrança leem dado da rede.
-- 3. Teto de gasto de IA da plataforma (platform_settings.ai_spend_ceiling_usd)
--    era só exibido; fn_ai_debit_credits agora recusa quando o gasto do mês
--    chega no teto, e recusa conta bloqueada. Conta cancelada não renova cota.
-- 4. Limites de plano (lojas, usuários, SKUs) e "pelo menos um proprietário"
--    contavam sem lock: requisições paralelas estouravam o limite. Lock na
--    linha do tenant antes de contar. Cadastro duplo simultâneo criava 2
--    tenants: advisory lock por usuário.
-- 5. Dois caixas abertos na mesma unidade (corrida em fn_cash_session_open):
--    índice único parcial + lock na unidade; abertura negativa recusada.
-- 6. Vendedor (pos=2) lançava crédito de loja ilimitado e "pagava" venda
--    com ele: crédito positivo agora exige money >= 2.
-- 7. fn_write_audit aceitava qualquer kind do client (dava pra forjar
--    'team.role_change' no histórico do dono). Client passa a usar
--    fn_write_audit_app, que só aceita os kinds que o app grava; a original
--    fica interna (só funções security definer chamam).
-- 8. fn_request_access: no máximo 10 pedidos por usuário por hora (cada
--    pedido vira email pros proprietários).
-- 9. stripe_events.processed_at: reserva de evento sem processed_at é
--    processamento em andamento ou execução que morreu — o webhook retoma.
-- 10. Rate limit de endpoints públicos (login, cadastro, recuperação):
--    rate_limit_hits + fn_rate_limit_hit, só service_role (RLS ligada sem
--    policy de propósito — ninguém além do service_role lê).
-- 11. Default privileges: o revoke por schema não anula o EXECUTE que o
--    Postgres dá a PUBLIC globalmente em toda função nova.

-- Sem leitura de auth.mfa_factors, auth_tenant_id() quebraria em runtime e
-- derrubaria o app inteiro. Falha aqui aborta a migration toda.
do $$ begin perform 1 from auth.mfa_factors limit 1; end $$;

-- ---------------------------------------------------------------------
-- 1. MFA
-- ---------------------------------------------------------------------
create or replace function public.mfa_satisfied()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
    or not exists (
      select 1 from auth.mfa_factors f
      where f.user_id = auth.uid() and f.status = 'verified'
    )
$$;
revoke execute on function public.mfa_satisfied() from public, anon;
grant execute on function public.mfa_satisfied() to authenticated;

create or replace function public.auth_tenant_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select tenant_id from public.profiles
  where id = auth.uid() and public.mfa_satisfied()
$$;

-- ---------------------------------------------------------------------
-- 2. Estado de acesso da conta (fonte única: proxy e has_access)
-- ---------------------------------------------------------------------
create or replace function public.fn_tenant_access(p_tenant_id uuid)
returns text
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_tenant public.tenants%rowtype;
  v_sub_status public.subscription_status;
begin
  select t.* into v_tenant from public.tenants t where t.id = p_tenant_id;
  if not found then
    return 'no_tenant';
  end if;

  select s.status into v_sub_status from public.subscriptions s
    where s.tenant_id = v_tenant.id
    order by (s.status in ('active', 'trialing', 'past_due')) desc, s.updated_at desc nulls last
    limit 1;

  return case
    when v_sub_status in ('active', 'trialing') then 'ok'
    when v_sub_status = 'past_due' then 'past_due'
    when v_sub_status = 'unpaid' then 'unpaid'
    when v_tenant.status = 'canceled' or v_sub_status = 'canceled' then 'canceled'
    when v_tenant.status = 'past_due' then 'past_due'
    when v_tenant.status = 'active' then 'ok'
    when v_tenant.trial_ends_at is not null and v_tenant.trial_ends_at < now() then 'trial_ended'
    else 'ok'
  end;
end;
$$;
revoke execute on function public.fn_tenant_access(uuid) from public, anon, authenticated;

create or replace function public.fn_session_context()
returns table (tenant_id uuid, role public.store_role, access text, trial_ends_at timestamptz)
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null then
    if not public.mfa_satisfied()
       and exists (select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id is not null) then
      return query select null::uuid, null::public.store_role, 'mfa_required'::text, null::timestamptz;
    else
      return query select null::uuid, null::public.store_role, 'no_tenant'::text, null::timestamptz;
    end if;
    return;
  end if;

  return query select
    v_tenant_id,
    (select su.role from public.store_users su where su.tenant_id = v_tenant_id and su.user_id = auth.uid() and su.status = 'active'),
    public.fn_tenant_access(v_tenant_id),
    (select t.trial_ends_at from public.tenants t where t.id = v_tenant_id);
end;
$$;
revoke execute on function public.fn_session_context() from public, anon;
grant execute on function public.fn_session_context() to authenticated;

create or replace function public.has_access(p_area text, p_min_level integer default 1)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (select raa.access >= p_min_level
     from public.role_area_access raa
     where raa.role = public.auth_role() and raa.area = p_area),
    false
  )
  and (
    p_min_level < 2
    or p_area in ('account', 'billing', 'company')
    or public.fn_tenant_access(public.auth_tenant_id()) in ('ok', 'past_due')
  )
$$;

-- ---------------------------------------------------------------------
-- 3. IA: teto de gasto da plataforma, conta bloqueada, renovação
-- ---------------------------------------------------------------------
create index if not exists ai_usage_log_created_at_idx on public.ai_usage_log (created_at);

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
  v_ceiling numeric;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('ai', 1) then
    raise exception 'not authorized';
  end if;
  if public.fn_tenant_access(v_tenant_id) not in ('ok', 'past_due') then
    raise exception 'Sua conta está bloqueada para IA até a assinatura ser regularizada.';
  end if;

  select credits into v_cost from public.ai_ops where id = p_op_id;
  if v_cost is null then
    raise exception 'operação de IA inválida';
  end if;

  select ai_spend_ceiling_usd into v_ceiling from public.platform_settings where id;
  if v_ceiling is not null and (
    select coalesce(sum(cost_usd), 0) from public.ai_usage_log
    where created_at >= date_trunc('month', now())
  ) >= v_ceiling then
    raise exception 'A IA está temporariamente indisponível. Tente de novo mais tarde.';
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

  insert into public.ai_credit_ledger (tenant_id, delta, balance_after, reason, op_id, from_plan, from_extra)
  values (v_tenant_id, -v_cost, (v_plan - v_from_plan) + (v_extra - v_from_extra), 'Uso: ' || p_op_id,
          p_op_id, v_from_plan, v_from_extra);

  return (v_plan - v_from_plan) + (v_extra - v_from_extra);
end;
$$;

-- Conta cancelada não recebe cota de plano (o crédito extra comprado fica).
create or replace function public.fn_ai_quota_for(p_plan_id text, p_status public.tenant_status)
returns integer
language sql stable security definer
set search_path = public
as $$
  select case
    when p_status = 'canceled' then 0
    when p_status = 'trial'
      then least(coalesce((select credits from public.plans where id = p_plan_id), 0),
                 coalesce((select trial_ai_credits from public.platform_settings limit 1), 100))
    else coalesce((select credits from public.plans where id = p_plan_id), 0)
  end
$$;
revoke execute on function public.fn_ai_quota_for(text, public.tenant_status) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Caixa: um aberto por unidade
-- ---------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from public.cash_sessions where status = 'open'
    group by store_id having count(*) > 1
  ) then
    raise notice 'cash_sessions: unidade com mais de um caixa aberto — índice único não criado; feche os duplicados e crie o índice.';
  else
    create unique index if not exists cash_sessions_one_open_per_store
      on public.cash_sessions (store_id) where status = 'open';
  end if;
end
$$;

alter table public.cash_sessions
  add constraint cash_sessions_opening_amount_non_negative check (opening_amount >= 0) not valid;

create or replace function public.fn_cash_session_open(p_store_id uuid, p_opening_amount numeric)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_session_id uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('pos', 2) then
    raise exception 'not authorized';
  end if;
  if p_opening_amount is null or p_opening_amount < 0 or p_opening_amount > 1000000 then
    raise exception 'valor de abertura inválido';
  end if;
  -- Lock na unidade: duas aberturas simultâneas passavam as duas no
  -- "not exists" abaixo.
  perform 1 from public.stores where id = p_store_id and tenant_id = v_tenant_id for update;
  if not found then
    raise exception 'loja inválida';
  end if;
  if exists (select 1 from public.cash_sessions where store_id = p_store_id and status = 'open') then
    raise exception 'já existe um caixa aberto nesta unidade';
  end if;

  insert into public.cash_sessions (tenant_id, store_id, operator_id, opening_amount, created_by)
  values (v_tenant_id, p_store_id, auth.uid(), p_opening_amount, auth.uid())
  returning id into v_session_id;

  insert into public.cash_session_movements (session_id, kind, amount, note, created_by)
  values (v_session_id, 'open', p_opening_amount, 'Abertura de caixa', auth.uid());

  return v_session_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. Crédito de loja: lançar crédito positivo é decisão financeira
-- ---------------------------------------------------------------------
create or replace function public.fn_customer_credit_adjust(p_customer_id uuid, p_delta numeric, p_reason text)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('pos', 2) then
    raise exception 'not authorized';
  end if;
  if p_delta > 0 and not public.has_access('money', 2) then
    raise exception 'Só o gestor financeiro ou o proprietário pode lançar crédito para o cliente.';
  end if;
  if length(coalesce(p_reason, '')) = 0 then
    raise exception 'informe o motivo do ajuste';
  end if;
  if p_delta is null or p_delta = 0 or abs(p_delta) > 100000 then
    raise exception 'valor de ajuste inválido';
  end if;
  return public.fn_customer_credit_apply(v_tenant_id, p_customer_id, p_delta, p_reason);
end;
$$;

-- ---------------------------------------------------------------------
-- 7. Auditoria: client só grava os kinds do app
-- ---------------------------------------------------------------------
create or replace function public.fn_write_audit_app(p_kind text, p_message text, p_target_type text default null, p_target_id uuid default null)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if p_kind not in ('supplier', 'promo', 'price') then
    raise exception 'tipo de registro de auditoria inválido';
  end if;
  perform public.fn_write_audit(p_kind, left(p_message, 500), p_target_type, p_target_id);
end;
$$;
revoke execute on function public.fn_write_audit_app(text, text, text, uuid) from public, anon;
grant execute on function public.fn_write_audit_app(text, text, text, uuid) to authenticated;
revoke execute on function public.fn_write_audit(text, text, text, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 8. Pedido de acesso com teto por hora
-- ---------------------------------------------------------------------
create or replace function public.fn_request_access(p_route text)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_name text;
  v_route text;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null then
    raise exception 'not authorized';
  end if;
  v_route := left(coalesce(nullif(trim(p_route), ''), '/'), 200);

  if exists (
    select 1 from public.notifications
    where tenant_id = v_tenant_id and kind = 'access_request' and target_id = auth.uid()
      and read_at is null and right(message, length(v_route) + 1) = ' ' || v_route
  ) then
    return;
  end if;

  -- Cada pedido vira email pros proprietários: sem teto, /a1, /a2… era spam.
  if (
    select count(*) from public.notifications
    where tenant_id = v_tenant_id and kind = 'access_request' and target_id = auth.uid()
      and created_at > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'Muitos pedidos de acesso em pouco tempo. Tente de novo mais tarde.';
  end if;

  select full_name into v_name from public.profiles where id = auth.uid();

  insert into public.notifications (tenant_id, kind, title, message, target_type, target_id)
  values (
    v_tenant_id, 'access_request', 'Pedido de acesso',
    format('%s (%s) pediu acesso à tela %s', coalesce(nullif(v_name, ''), 'Um usuário'), coalesce(public.auth_role()::text, 'sem perfil'), v_route),
    'user', auth.uid()
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 9. Webhook do Stripe: reserva x processado
-- ---------------------------------------------------------------------
alter table public.stripe_events add column if not exists processed_at timestamptz;
-- Toda reserva antiga já foi processada (falha apagava a reserva).
update public.stripe_events set processed_at = received_at where processed_at is null;
grant update on public.stripe_events to service_role;

-- ---------------------------------------------------------------------
-- 10. Rate limit (janela fixa). Só service_role: exposto ao client, qualquer
--     um queimaria a cota do email de outra pessoa e travaria o login dela.
-- ---------------------------------------------------------------------
create table if not exists public.rate_limit_hits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);
alter table public.rate_limit_hits enable row level security;
revoke all on public.rate_limit_hits from anon, authenticated;
grant select, insert, update, delete on public.rate_limit_hits to service_role;

-- true = dentro do limite (o hit conta); false = estourou.
create or replace function public.fn_rate_limit_hit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql security definer
set search_path = public
as $$
declare
  v_window timestamptz;
  v_hits integer;
begin
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.rate_limit_hits (key, window_start, hits)
  values (left(p_key, 200), v_window, 1)
  on conflict (key, window_start) do update set hits = public.rate_limit_hits.hits + 1
  returning hits into v_hits;

  -- Limpeza preguiçosa: janela velha não serve pra nada.
  if random() < 0.01 then
    delete from public.rate_limit_hits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_max;
end;
$$;
revoke execute on function public.fn_rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.fn_rate_limit_hit(text, integer, integer) to service_role;

-- ---------------------------------------------------------------------
-- 11. Default privileges globais
-- ---------------------------------------------------------------------
alter default privileges for role postgres revoke execute on functions from public;

-- ---------------------------------------------------------------------
-- 4. Limites de plano com lock: definições vigentes, só com o lock na
--    linha do tenant (ou advisory lock por usuário) antes de contar.
-- ---------------------------------------------------------------------

create or replace function public.fn_create_store(p_name text, p_type text, p_city text, p_cnpj text default null)
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
  -- Lock no tenant: contagem de limite/proprietários sem corrida.
  perform 1 from public.tenants where id = v_tenant_id for update;
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

create or replace function public.fn_team_invite(
  p_email text, p_full_name text, p_role public.store_role
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_limit integer;
  v_used integer;
  v_token uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('people', 3) then
    raise exception 'not authorized';
  end if;
  -- Lock no tenant: contagem de limite/proprietários sem corrida.
  perform 1 from public.tenants where id = v_tenant_id for update;

  p_email := lower(trim(p_email));
  if p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'email inválido';
  end if;

  p_full_name := nullif(trim(p_full_name), '');

  if exists (
    select 1 from public.store_users su
    join auth.users u on u.id = su.user_id
    where su.tenant_id = v_tenant_id and lower(u.email) = p_email
  ) then
    raise exception 'Esta pessoa já faz parte da equipe.';
  end if;

  -- Assento ocupado conta membro ativo + convite em aberto: senão dava pra
  -- estourar o limite do plano disparando convites em lote.
  select coalesce((pl.limits->>'users')::integer, 0) into v_limit
  from public.tenants t join public.plans pl on pl.id = t.plan_id
  where t.id = v_tenant_id;

  select (select count(*) from public.store_users where tenant_id = v_tenant_id)
       + (select count(*) from public.invites
          where tenant_id = v_tenant_id and accepted_at is null and expires_at > now()
            and lower(email) <> p_email)
    into v_used;

  if v_limit > 0 and v_used >= v_limit then
    raise exception 'Seu plano permite % usuários. Faça upgrade para convidar mais.', v_limit;
  end if;

  insert into public.invites (tenant_id, email, full_name, role, invited_by)
  values (v_tenant_id, p_email, p_full_name, p_role, auth.uid())
  on conflict (tenant_id, email) do update
    set full_name = excluded.full_name,
        role = excluded.role,
        invited_by = excluded.invited_by,
        token = gen_random_uuid(),
        expires_at = now() + interval '7 days',
        accepted_at = null,
        created_at = now()
  returning token into v_token;

  perform public.fn_write_audit('team.invite', 'Convite enviado para ' || p_email, 'invite', null);
  return v_token;
end;
$$;

create or replace function public.fn_team_set_role(p_user_id uuid, p_role public.store_role)
returns void
language plpgsql security definer
set search_path = public
as $$
declare v_tenant_id uuid; v_current public.store_role;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('people', 3) then
    raise exception 'not authorized';
  end if;
  -- Lock no tenant: contagem de limite/proprietários sem corrida.
  perform 1 from public.tenants where id = v_tenant_id for update;

  select role into v_current from public.store_users
  where tenant_id = v_tenant_id and user_id = p_user_id;
  if v_current is null then
    raise exception 'Pessoa não encontrada nesta rede.';
  end if;

  -- Rede sem nenhum proprietário fica sem quem conceda acesso — ninguém
  -- consegue reverter isso pela própria interface.
  if v_current = 'proprietario' and p_role <> 'proprietario'
     and (select count(*) from public.store_users
          where tenant_id = v_tenant_id and role = 'proprietario') <= 1 then
    raise exception 'A rede precisa de pelo menos um proprietário.';
  end if;

  update public.store_users set role = p_role
  where tenant_id = v_tenant_id and user_id = p_user_id;

  perform public.fn_write_audit('team.role_change', 'Perfil alterado para ' || p_role, 'user', p_user_id);
end;
$$;

create or replace function public.fn_team_remove(p_user_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare v_tenant_id uuid; v_current public.store_role;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('people', 3) then
    raise exception 'not authorized';
  end if;
  -- Lock no tenant: contagem de limite/proprietários sem corrida.
  perform 1 from public.tenants where id = v_tenant_id for update;

  if p_user_id = auth.uid() then
    raise exception 'Você não pode remover a si mesmo.';
  end if;

  select role into v_current from public.store_users
  where tenant_id = v_tenant_id and user_id = p_user_id;
  if v_current is null then
    raise exception 'Pessoa não encontrada nesta rede.';
  end if;

  if v_current = 'proprietario'
     and (select count(*) from public.store_users
          where tenant_id = v_tenant_id and role = 'proprietario') <= 1 then
    raise exception 'A rede precisa de pelo menos um proprietário.';
  end if;

  delete from public.store_users where tenant_id = v_tenant_id and user_id = p_user_id;
  update public.profiles set tenant_id = null where id = p_user_id and tenant_id = v_tenant_id;

  perform public.fn_write_audit('team.remove', 'Acesso removido da rede', 'user', p_user_id);
end;
$$;

create or replace function public.fn_enforce_sku_limit()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_used integer;
begin
  if not new.active then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.active then
    return new;
  end if;

  select (pl.limits->>'skus')::integer into v_limit
  from public.tenants t join public.plans pl on pl.id = t.plan_id
  where t.id = new.tenant_id;

  if v_limit is null then
    return new;
  end if;

  perform 1 from public.tenants where id = new.tenant_id for update;
  select count(*) into v_used from public.products where tenant_id = new.tenant_id and active;
  if v_used >= v_limit then
    raise exception 'limit_reached:skus';
  end if;
  return new;
end;
$$;

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
  -- Dois envios simultâneos passavam os dois no "already has a tenant".
  perform pg_advisory_xact_lock(hashtext('complete_signup:' || auth.uid()::text));
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

-- ---------------------------------------------------------------------
-- 12. LGPD: correção e eliminação de dados do cliente final (art. 18).
--     Anonimizar mantém vendas e extrato de crédito (registro fiscal e
--     financeiro da loja), apaga só os dados pessoais.
-- ---------------------------------------------------------------------
alter table public.customers add column if not exists anonymized_at timestamptz;

create or replace function public.fn_customer_update(
  p_customer_id uuid, p_name text, p_doc text default null, p_phone text default null,
  p_email text default null, p_notes text default null
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('pos', 2) then
    raise exception 'not authorized';
  end if;
  if length(trim(coalesce(p_name, ''))) = 0 then
    raise exception 'informe o nome do cliente';
  end if;
  if length(p_name) > 120 or length(coalesce(p_doc, '')) > 20 or length(coalesce(p_phone, '')) > 30
     or length(coalesce(p_email, '')) > 254 or length(coalesce(p_notes, '')) > 1000 then
    raise exception 'Algum campo do cadastro está longo demais.';
  end if;

  update public.customers
    set name = trim(p_name), doc = nullif(trim(p_doc), ''), phone = nullif(trim(p_phone), ''),
        email = nullif(trim(p_email), ''), notes = nullif(trim(p_notes), '')
    where id = p_customer_id and tenant_id = v_tenant_id and anonymized_at is null;
  if not found then
    raise exception 'cliente não encontrado';
  end if;

  perform public.fn_write_audit('customer', 'Cadastro de cliente corrigido', 'customer', p_customer_id);
end;
$$;
revoke execute on function public.fn_customer_update(uuid, text, text, text, text, text) from public, anon;
grant execute on function public.fn_customer_update(uuid, text, text, text, text, text) to authenticated;

create or replace function public.fn_customer_anonymize(p_customer_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_anonymized timestamptz;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not (public.has_access('people', 3) or public.has_access('money', 2)) then
    raise exception 'not authorized';
  end if;

  select anonymized_at into v_anonymized from public.customers
    where id = p_customer_id and tenant_id = v_tenant_id for update;
  if not found then
    raise exception 'cliente não encontrado';
  end if;
  if v_anonymized is not null then
    raise exception 'Este cliente já foi anonimizado.';
  end if;

  update public.customers
    set name = 'Cliente anonimizado', doc = null, phone = null, email = null, notes = null, anonymized_at = now()
    where id = p_customer_id;

  -- Sem nome/documento na mensagem: o histórico não pode guardar o que acabou de ser apagado.
  perform public.fn_write_audit('customer.anonymize', 'Dados pessoais de um cliente anonimizados (LGPD)', 'customer', p_customer_id);
end;
$$;
revoke execute on function public.fn_customer_anonymize(uuid) from public, anon;
grant execute on function public.fn_customer_anonymize(uuid) to authenticated;
