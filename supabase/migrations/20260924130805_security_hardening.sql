-- Hardening de segurança da auditoria de produção (2026-09-24).
--
-- Achados confirmados ao vivo antes desta migration:
-- 1. Nenhuma migration revogava o EXECUTE default de PUBLIC/anon. Todas as
--    funções security definer eram chamáveis sem login via /rest/v1/rpc —
--    inclusive fn_ai_credit_pack_purchase e fn_ai_apply_plan_change, que
--    recebem p_tenant_id e não checam nada (créditos/plano de qualquer
--    tenant por qualquer pessoa com a anon key).
-- 2. profiles tinha grant de UPDATE na tabela inteira + policy id=auth.uid():
--    o usuário trocava o próprio tenant_id e "entrava" em outro tenant.
-- 3. fn_ai_refund_credits não era amarrado a um débito: chamada em loop
--    gerava crédito.
-- 4. fn_stock_exchange/fn_stock_return não validavam o produto contra o
--    tenant (o fix de 20260920070000 não foi replicado nelas).
-- 5. fn_complete_signup aceitava plano inativo.
-- 6. is_platform_staff() ignorava o 2FA (aal) exigido do staff.
-- 7. Policies de escrita direta em stores/store_users/invites/customers
--    permitiam pular os limites de plano e a regra "≥1 proprietário" das
--    RPCs. O app nunca escreve direto nessas tabelas (só via RPC).
-- 8. Policies "select to public" nos buckets permitiam listar objetos e
--    descobrir tenant_ids pelos caminhos. Bucket público serve URL sem
--    policy de select.

-- ---------------------------------------------------------------------
-- 1. EXECUTE: nega por padrão, libera explicitamente
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon;

-- Páginas públicas (sem sessão): convite e copy de trial.
grant execute on function public.fn_invite_preview(uuid) to anon;
grant execute on function public.fn_platform_trial_days() to anon;

-- Só o webhook do Stripe (service_role) e o pg_cron chamam estas.
revoke execute on function public.fn_ai_credit_pack_purchase(uuid, text, text) from authenticated;
revoke execute on function public.fn_ai_apply_plan_change(uuid, text, timestamptz) from authenticated;
revoke execute on function public.fn_ai_renew_cycle() from authenticated;
grant execute on function public.fn_ai_credit_pack_purchase(uuid, text, text) to service_role;
grant execute on function public.fn_ai_apply_plan_change(uuid, text, timestamptz) to service_role;
grant execute on function public.fn_ai_renew_cycle() to service_role;

-- Funções internas (trigger/event trigger) não são RPC.
revoke execute on function public.fn_enforce_sku_limit() from authenticated;
-- rls_auto_enable() é criada pelo Supabase só nos projetos em nuvem: num
-- banco novo (db reset local) ela não existe e o revoke direto quebrava a
-- migration. Exceção autorizada ao append-only (ver .spec/quality-gates.md,
-- item 7) — em produção nada muda, esta versão já estava aplicada.
do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'rls_auto_enable') then
    execute 'revoke execute on function public.rls_auto_enable() from authenticated';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2. profiles: só colunas de perfil são editáveis pelo próprio usuário
-- ---------------------------------------------------------------------
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, initials, phone, avatar_url) on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- 3. Escrita direta que pulava as RPCs (limites de plano / proprietário)
-- ---------------------------------------------------------------------
drop policy if exists stores_write on public.stores;
drop policy if exists store_users_write on public.store_users;
drop policy if exists invites_manage on public.invites;
drop policy if exists customers_write on public.customers;
revoke insert, update, delete on public.stores, public.store_users, public.invites, public.customers from anon, authenticated;
-- invites ficaria com RLS + zero policy (nega tudo em silêncio): leitura
-- explícita pra quem gere pessoas, escrita só via fn_team_invite/cancel.
create policy invites_select on public.invites
  for select to authenticated
  using (tenant_id = public.auth_tenant_id() and public.has_access('people', 3));

-- ---------------------------------------------------------------------
-- 4. Storage: sem listagem pública
-- ---------------------------------------------------------------------
drop policy if exists product_photos_read on storage.objects;
drop policy if exists store_branding_read on storage.objects;
drop policy if exists avatars_read on storage.objects;

-- ---------------------------------------------------------------------
-- 5. Estorno de IA amarrado ao débito
-- ---------------------------------------------------------------------
alter table public.ai_credit_ledger
  add column if not exists op_id text,
  add column if not exists from_plan integer,
  add column if not exists from_extra integer,
  add column if not exists refunded_at timestamptz;

create index if not exists ai_credit_ledger_refundable_idx
  on public.ai_credit_ledger (tenant_id, op_id, created_at desc)
  where delta < 0 and refunded_at is null;

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

  insert into public.ai_credit_ledger (tenant_id, delta, balance_after, reason, op_id, from_plan, from_extra)
  values (v_tenant_id, -v_cost, (v_plan - v_from_plan) + (v_extra - v_from_extra), 'Uso: ' || p_op_id,
          p_op_id, v_from_plan, v_from_extra);

  return (v_plan - v_from_plan) + (v_extra - v_from_extra);
end;
$$;

-- Estorna só um débito real, recente (15 min — cobre o timeout da chamada
-- à IA) e ainda não estornado, devolvendo pra origem certa (plano/extra).
create or replace function public.fn_ai_refund_credits(p_op_id text)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_debit public.ai_credit_ledger%rowtype;
  v_plan integer;
  v_extra integer;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null then
    raise exception 'not authorized';
  end if;

  select * into v_debit from public.ai_credit_ledger
    where tenant_id = v_tenant_id and op_id = p_op_id and delta < 0
      and refunded_at is null and created_at > now() - interval '15 minutes'
    order by created_at desc
    limit 1
    for update skip locked;
  if not found then
    raise exception 'nenhum débito elegível para estorno';
  end if;

  update public.ai_credit_ledger set refunded_at = now() where id = v_debit.id;

  update public.tenants
    set ai_credit_plan_balance = ai_credit_plan_balance + coalesce(v_debit.from_plan, -v_debit.delta),
        ai_credit_extra_balance = ai_credit_extra_balance + coalesce(v_debit.from_extra, 0)
    where id = v_tenant_id
    returning ai_credit_plan_balance, ai_credit_extra_balance into v_plan, v_extra;

  insert into public.ai_credit_ledger (tenant_id, delta, balance_after, reason, op_id)
  values (v_tenant_id, -v_debit.delta, v_plan + v_extra, 'Estorno: falha em ' || p_op_id, p_op_id);

  return v_plan + v_extra;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. Troca/devolução: produto precisa ser do tenant
-- ---------------------------------------------------------------------
create or replace function public.fn_stock_exchange(
  p_store_id uuid,
  p_returned_product_id uuid,
  p_delivered_product_id uuid,
  p_qty integer,
  p_reason text,
  p_notes text default null
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_exchange_id uuid;
  v_before integer;
  v_after integer;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('stock', 2) then
    raise exception 'not authorized';
  end if;
  if p_qty is null or p_qty <= 0 then
    raise exception 'quantidade precisa ser positiva';
  end if;
  if p_returned_product_id = p_delivered_product_id then
    raise exception 'itens devolvido e entregue precisam ser diferentes';
  end if;
  if not exists (select 1 from public.stores where id = p_store_id and tenant_id = v_tenant_id) then
    raise exception 'loja inválida';
  end if;
  if (select count(*) from public.products
        where id in (p_returned_product_id, p_delivered_product_id) and tenant_id = v_tenant_id) <> 2 then
    raise exception 'produto inválido';
  end if;

  v_exchange_id := gen_random_uuid();

  -- Linha travada antes de ler: duas trocas simultâneas não perdem update.
  insert into public.stock_balances (product_id, store_id, qty)
  values (p_returned_product_id, p_store_id, 0), (p_delivered_product_id, p_store_id, 0)
  on conflict (product_id, store_id) do nothing;

  select qty into v_before from public.stock_balances
    where product_id = p_returned_product_id and store_id = p_store_id for update;
  v_after := v_before + p_qty;
  update public.stock_balances set qty = v_after, updated_at = now()
    where product_id = p_returned_product_id and store_id = p_store_id;
  insert into public.stock_movements (tenant_id, store_id, product_id, kind, qty, before_qty, after_qty, reference_type, reference_id, reason, justification, created_by)
  values (v_tenant_id, p_store_id, p_returned_product_id, 'exchange', p_qty, v_before, v_after, 'exchange', v_exchange_id, p_reason, p_notes, auth.uid());

  select qty into v_before from public.stock_balances
    where product_id = p_delivered_product_id and store_id = p_store_id for update;
  if v_before < p_qty then
    raise exception 'saldo insuficiente do item entregue';
  end if;
  v_after := v_before - p_qty;
  update public.stock_balances set qty = v_after, updated_at = now()
    where product_id = p_delivered_product_id and store_id = p_store_id;
  insert into public.stock_movements (tenant_id, store_id, product_id, kind, qty, before_qty, after_qty, reference_type, reference_id, reason, justification, created_by)
  values (v_tenant_id, p_store_id, p_delivered_product_id, 'exchange', -p_qty, v_before, v_after, 'exchange', v_exchange_id, p_reason, p_notes, auth.uid());

  return v_exchange_id;
end;
$$;

create or replace function public.fn_stock_return(
  p_store_id uuid,
  p_product_id uuid,
  p_qty integer,
  p_reason text,
  p_restock boolean,
  p_notes text default null
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_before integer;
  v_after integer;
  v_movement_id uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('stock', 2) then
    raise exception 'not authorized';
  end if;
  if p_qty is null or p_qty <= 0 then
    raise exception 'quantidade precisa ser positiva';
  end if;
  if not exists (select 1 from public.stores where id = p_store_id and tenant_id = v_tenant_id) then
    raise exception 'loja inválida';
  end if;
  if not exists (select 1 from public.products where id = p_product_id and tenant_id = v_tenant_id) then
    raise exception 'produto inválido';
  end if;

  insert into public.stock_balances (product_id, store_id, qty)
  values (p_product_id, p_store_id, 0)
  on conflict (product_id, store_id) do nothing;
  select qty into v_before from public.stock_balances
    where product_id = p_product_id and store_id = p_store_id for update;

  if p_restock then
    v_after := v_before + p_qty;
    update public.stock_balances set qty = v_after, updated_at = now()
      where product_id = p_product_id and store_id = p_store_id;
  else
    -- vai para avaria: não retorna ao estoque vendável, mas o movimento
    -- fica registrado (qty 0) pra auditoria de devoluções por motivo.
    v_after := v_before;
  end if;

  insert into public.stock_movements (tenant_id, store_id, product_id, kind, qty, before_qty, after_qty, reference_type, reason, justification, created_by)
  values (v_tenant_id, p_store_id, p_product_id, 'return', case when p_restock then p_qty else 0 end, v_before, v_after,
    case when p_restock then 'restock' else 'avaria' end, p_reason, p_notes, auth.uid())
  returning id into v_movement_id;

  return v_movement_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 7. Cadastro só em plano ativo
-- ---------------------------------------------------------------------
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
  if coalesce(btrim(p_full_name), '') = '' or coalesce(btrim(p_store_name), '') = '' then
    raise exception 'nome e loja são obrigatórios';
  end if;

  select credits into v_initial_credits from public.plans where id = p_plan_id and active;
  if not found then
    raise exception 'plano inválido';
  end if;

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

-- ---------------------------------------------------------------------
-- 8. Staff da plataforma só vale com 2FA verificado quando exigido
-- ---------------------------------------------------------------------
create or replace function public.is_platform_staff()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_staff
    where user_id = auth.uid()
      and (not mfa_required or coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2')
  )
$$;

-- create or replace preserva ACL, mas as funções recriadas acima são
-- re-garantidas explicitamente pra deixar o contrato legível aqui.
grant execute on function public.fn_ai_debit_credits(text) to authenticated;
grant execute on function public.fn_ai_refund_credits(text) to authenticated;
grant execute on function public.fn_stock_exchange(uuid, uuid, uuid, integer, text, text) to authenticated;
grant execute on function public.fn_stock_return(uuid, uuid, integer, text, boolean, text) to authenticated;
grant execute on function public.fn_complete_signup(text, text, text, text, text) to authenticated;
grant execute on function public.is_platform_staff() to authenticated;
