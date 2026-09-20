-- Fase 10 — console da plataforma (core: lojas, usuários da plataforma,
-- planos, impersonação auditada). Assinaturas/MRR (subscriptions,
-- ai-monitoring) ficam mock: dependem de Fase 9 (Stripe) e Fase 7
-- (Anthropic), que ainda não existem. admin-economics.jsx continua cálculo
-- puro por decisão já registrada no plano.

-- audit_log ganha "scope": ações do console de plataforma (impersonação,
-- mudança de plano feita por staff) diferem de ações do próprio tenant —
-- tenant_id aqui vira "sobre qual tenant", não "quem tem permissão de ver".
alter table public.audit_log add column scope text not null default 'tenant';

create policy audit_log_staff_select on public.audit_log
  for select to authenticated using (public.is_platform_staff());

create table public.plans (
  id text primary key,
  name text not null,
  tagline text,
  who text,
  monthly_price numeric(12, 2) not null,
  yearly_price numeric(12, 2),
  credits integer not null default 0,
  limits jsonb not null default '{}',
  popular boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.plans (id, name, tagline, who, monthly_price, yearly_price, credits, limits, popular) values
  ('balcao', 'Balcão', 'Sair da planilha sem susto no boleto.', 'Uma loja, até 2 pessoas no caixa.', 89, 890, 300, '{"skus":300,"users":2,"stores":1,"cats":3,"history":"12 meses"}', false),
  ('controle', 'Controle', 'O plano de quem já perde dinheiro com ruptura.', 'Até 3 lojas com estoque de verdade.', 149, 1490, 1500, '{"skus":null,"users":8,"stores":3,"cats":null,"history":"24 meses"}', true),
  ('rede', 'Rede', 'Operação multi-loja com reposição automática.', 'Redes que transferem estoque entre unidades.', 279, 2790, 3500, '{"skus":null,"users":null,"stores":null,"cats":null,"history":"5 anos"}', false);

create function public.fn_platform_plan_upsert(
  p_id text, p_name text, p_tagline text, p_who text, p_monthly_price numeric, p_yearly_price numeric,
  p_credits integer, p_limits jsonb, p_popular boolean, p_active boolean
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_platform_staff() then
    raise exception 'not authorized';
  end if;
  insert into public.plans (id, name, tagline, who, monthly_price, yearly_price, credits, limits, popular, active)
  values (p_id, p_name, p_tagline, p_who, p_monthly_price, p_yearly_price, p_credits, p_limits, p_popular, p_active)
  on conflict (id) do update set
    name = excluded.name, tagline = excluded.tagline, who = excluded.who,
    monthly_price = excluded.monthly_price, yearly_price = excluded.yearly_price,
    credits = excluded.credits, limits = excluded.limits, popular = excluded.popular, active = excluded.active;
end;
$$;
grant execute on function public.fn_platform_plan_upsert(text, text, text, text, numeric, numeric, integer, jsonb, boolean, boolean) to authenticated;

alter table public.plans enable row level security;
create policy plans_staff_all on public.plans
  for all to authenticated using (public.is_platform_staff()) with check (public.is_platform_staff());
grant select, insert, update, delete on public.plans to authenticated;

-- ============================================================
-- Impersonação — grava intenção e motivo, nunca assume a sessão do usuário
-- do tenant (staff não vira o usuário; só ganha uma janela de leitura
-- ampliada, auditada, das telas de apoio ao cliente do próprio console).
-- ============================================================
create table public.impersonation_sessions (
  id uuid primary key default gen_random_uuid(),
  staff_user_id uuid not null references auth.users(id),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  reason text not null,
  ticket_ref text,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create index impersonation_sessions_tenant_id_idx on public.impersonation_sessions (tenant_id);

create function public.fn_start_impersonation(p_tenant_id uuid, p_reason text, p_ticket_ref text default null)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_session_id uuid;
begin
  if not public.is_platform_staff() then
    raise exception 'not authorized';
  end if;
  if length(coalesce(p_reason, '')) = 0 then
    raise exception 'informe o motivo do acesso';
  end if;
  if not exists (select 1 from public.tenants where id = p_tenant_id) then
    raise exception 'rede não encontrada';
  end if;

  insert into public.impersonation_sessions (staff_user_id, tenant_id, reason, ticket_ref)
  values (auth.uid(), p_tenant_id, p_reason, p_ticket_ref)
  returning id into v_session_id;

  insert into public.audit_log (tenant_id, kind, message, target_type, target_id, created_by, scope)
  values (p_tenant_id, 'user', format('Acesso de suporte iniciado — motivo: %s%s', p_reason, case when p_ticket_ref is not null then ' · ref ' || p_ticket_ref else '' end), 'impersonation', v_session_id, auth.uid(), 'platform');

  return v_session_id;
end;
$$;
grant execute on function public.fn_start_impersonation(uuid, text, text) to authenticated;

create function public.fn_end_impersonation(p_session_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  if not public.is_platform_staff() then
    raise exception 'not authorized';
  end if;
  update public.impersonation_sessions set ended_at = now()
  where id = p_session_id and staff_user_id = auth.uid() and ended_at is null
  returning tenant_id into v_tenant_id;
  if v_tenant_id is null then
    raise exception 'sessão não encontrada';
  end if;

  insert into public.audit_log (tenant_id, kind, message, target_type, target_id, created_by, scope)
  values (v_tenant_id, 'user', 'Acesso de suporte encerrado', 'impersonation', p_session_id, auth.uid(), 'platform');
end;
$$;
grant execute on function public.fn_end_impersonation(uuid) to authenticated;

alter table public.impersonation_sessions enable row level security;
create policy impersonation_sessions_staff on public.impersonation_sessions
  for select to authenticated using (public.is_platform_staff());
grant select on public.impersonation_sessions to authenticated;
