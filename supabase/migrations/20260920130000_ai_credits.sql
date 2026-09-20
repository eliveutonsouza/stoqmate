-- Fase 7 — IA real via Anthropic. window.claude.complete() era o harness de
-- dev deste ambiente — nunca existiu pra um usuário de verdade fora daqui.
--
-- Decisão de arquitetura (desvia do plano original): as chamadas de IA viram
-- Server Actions do Next.js, não Edge Functions do Supabase. A chave nunca
-- chega ao browser dos dois jeitos, mas Edge Function só é estrutural quando
-- ALGUÉM DE FORA precisa chamar seu endpoint (é o caso do webhook do
-- Stripe — a Stripe empurra pra você). Aqui é o próprio usuário chamando a
-- própria IA a partir do próprio app; Server Action já resolve com uma
-- linguagem a menos no projeto e reaproveitando createClient()/has_access()
-- que toda outra mutação já usa.

create table public.ai_ops (
  id text primary key,
  label text not null,
  credits integer not null
);
insert into public.ai_ops (id, label, credits) values
  ('ask', 'Pergunta em linguagem natural', 1),
  ('classify', 'Classificação no cadastro', 1),
  ('enrich', 'Enriquecimento de catálogo', 1),
  ('price', 'Preço sugerido por elasticidade', 2),
  ('forecast', 'Previsão de demanda', 2),
  ('ocr', 'Leitura de nota fiscal por foto', 5),
  ('anomaly', 'Detecção de anomalia', 6);
grant select on public.ai_ops to authenticated;

alter table public.tenants add column ai_credit_balance integer not null default 0;

create table public.ai_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  delta integer not null,
  balance_after integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);
create index ai_credit_ledger_tenant_id_idx on public.ai_credit_ledger (tenant_id);

create table public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  op_id text not null references public.ai_ops(id),
  model text not null,
  tokens_in integer,
  tokens_out integer,
  cost_usd numeric(10, 6),
  status text not null, -- ok | error
  error_message text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index ai_usage_log_tenant_id_idx on public.ai_usage_log (tenant_id, created_at desc);

alter table public.ai_credit_ledger enable row level security;
create policy ai_credit_ledger_select on public.ai_credit_ledger
  for select to authenticated using (tenant_id = public.auth_tenant_id() and public.has_access('ai', 1));
grant select on public.ai_credit_ledger to authenticated;

alter table public.ai_usage_log enable row level security;
create policy ai_usage_log_select on public.ai_usage_log
  for select to authenticated using (tenant_id = public.auth_tenant_id() and public.has_access('ai', 1));
grant select on public.ai_usage_log to authenticated;

-- Concede a cota do plano na hora do cadastro. Renovação mensal por ciclo de
-- cobrança fica de fora desta fase (TODO — precisa de um cron amarrado ao
-- current_period_end de subscriptions; sem isso o crédito inicial já dá pra
-- operar e testar de verdade).
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

  insert into public.tenants (name, subdomain, cnpj, plan_id, ai_credit_balance)
  values (p_store_name, p_subdomain, p_cnpj, p_plan_id, coalesce(v_initial_credits, 0))
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
grant execute on function public.fn_complete_signup(text, text, text, text, text) to authenticated;

-- fn_ai_debit_credits — chamada ANTES da requisição à Anthropic. Se não tiver
-- saldo, nem gasta o dinheiro de inferência.
create function public.fn_ai_debit_credits(p_op_id text)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_cost integer;
  v_before integer;
  v_after integer;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('ai', 1) then
    raise exception 'not authorized';
  end if;

  select credits into v_cost from public.ai_ops where id = p_op_id;
  if v_cost is null then
    raise exception 'operação de IA inválida';
  end if;

  select ai_credit_balance into v_before from public.tenants where id = v_tenant_id for update;
  if v_before < v_cost then
    raise exception 'saldo de créditos de IA insuficiente';
  end if;
  v_after := v_before - v_cost;

  update public.tenants set ai_credit_balance = v_after where id = v_tenant_id;
  insert into public.ai_credit_ledger (tenant_id, delta, balance_after, reason)
  values (v_tenant_id, -v_cost, v_after, 'Uso: ' || p_op_id);

  return v_after;
end;
$$;
grant execute on function public.fn_ai_debit_credits(text) to authenticated;

-- fn_ai_refund_credits — chamada quando a Anthropic falha DEPOIS do débito.
create function public.fn_ai_refund_credits(p_op_id text)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_cost integer;
  v_before integer;
  v_after integer;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null then
    raise exception 'not authorized';
  end if;

  select credits into v_cost from public.ai_ops where id = p_op_id;
  if v_cost is null then
    raise exception 'operação de IA inválida';
  end if;

  select ai_credit_balance into v_before from public.tenants where id = v_tenant_id for update;
  v_after := v_before + v_cost;

  update public.tenants set ai_credit_balance = v_after where id = v_tenant_id;
  insert into public.ai_credit_ledger (tenant_id, delta, balance_after, reason)
  values (v_tenant_id, v_cost, v_after, 'Estorno: falha em ' || p_op_id);

  return v_after;
end;
$$;
grant execute on function public.fn_ai_refund_credits(text) to authenticated;

create function public.fn_write_ai_usage(
  p_op_id text, p_model text, p_tokens_in integer, p_tokens_out integer,
  p_cost_usd numeric, p_status text, p_error_message text default null
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
  insert into public.ai_usage_log (tenant_id, op_id, model, tokens_in, tokens_out, cost_usd, status, error_message, created_by)
  values (v_tenant_id, p_op_id, p_model, p_tokens_in, p_tokens_out, p_cost_usd, p_status, p_error_message, auth.uid());
end;
$$;
grant execute on function public.fn_write_ai_usage(text, text, integer, integer, numeric, text, text) to authenticated;
