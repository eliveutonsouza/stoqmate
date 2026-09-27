-- Auditoria de produção (28/09): endurecimento do banco.
-- Nada aqui muda tabela de dados; são checagens, grants e índices.
--
--  1. Devolver valor ao cliente (dinheiro/crédito da loja) exige money ≥ 2.
--     Antes qualquer estoquista pagava estorno sem venda por trás.
--  2. Receber transferência/pedido com a mesma linha repetida somava o
--     estoque duas vezes.
--  3. Estorno de crédito de IA e log de uso só pelo servidor (service_role;
--     as versões antigas saem de authenticated numa migration pós-deploy):
--     o usuário chamava fn_ai_refund_credits direto e recuperava o crédito
--     depois de uma chamada bem-sucedida; fn_write_ai_usage aceitava custo
--     inventado.
--  4. Fila de emails de aviso só pelo servidor (idem): qualquer usuário da rede
--     (vendedor) lia o email dos proprietários e marcava a fila como enviada.
--  5. plans: a policy "for all" deixava qualquer staff (comercial,
--     engenharia) escrever direto, pulando o super_admin da RPC.
--  6. products: sem DELETE direto (apagava o histórico em cascata; o app
--     só desativa). notifications: sem UPDATE direto (dava pra reescrever
--     o texto do aviso); leitura marcada via fn_mark_notifications_read.
--  7. locations.store_id precisa ser loja da mesma rede.
--  8. Impersonação só super_admin/suporte; criar rede não sequestra um
--     usuário que já pertence a outra rede.
--  9. Índices nas FKs de tabelas que crescem.

-- 1 ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_register_payments(p_tenant_id uuid, p_store_id uuid, p_document_type text, p_document_id uuid, p_direction text, p_customer_id uuid, p_payments jsonb, p_expected numeric, p_note text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_entry jsonb;
  v_method text;
  v_amount numeric;
  v_installments integer;
  v_sum numeric := 0;
  v_count integer := 0;
  v_cash_control boolean;
  v_session_id uuid;
  v_allowed text[];
  v_summary text;
begin
  if p_payments is null or jsonb_typeof(p_payments) <> 'array' then
    p_payments := '[]'::jsonb;
  end if;
  if jsonb_array_length(p_payments) > 6 then
    raise exception 'no máximo 6 formas de pagamento por documento';
  end if;

  -- Devolver valor é saída de dinheiro: só quem cuida do financeiro.
  -- Quem não tem, registra a devolução/troca sem acerto.
  if p_direction = 'out' and jsonb_array_length(p_payments) > 0 and not public.has_access('money', 2) then
    raise exception 'seu perfil não pode devolver valores ao cliente';
  end if;

  v_allowed := case when p_direction = 'in'
    then array['dinheiro', 'pix', 'debito', 'credito', 'credito_loja', 'outro']
    else array['dinheiro', 'pix', 'credito_loja', 'outro'] end;

  for v_entry in select * from jsonb_array_elements(p_payments)
  loop
    v_method := v_entry ->> 'method';
    v_amount := round(coalesce((v_entry ->> 'amount')::numeric, 0), 2);
    v_installments := coalesce((v_entry ->> 'installments')::integer, 1);
    if v_method is null or not (v_method = any (v_allowed)) then
      raise exception 'forma de pagamento inválida: %', coalesce(v_method, '(vazia)');
    end if;
    if v_amount <= 0 then
      raise exception 'valor de pagamento precisa ser positivo';
    end if;
    if v_installments < 1 or v_installments > 12 or (v_installments > 1 and v_method <> 'credito') then
      raise exception 'parcelas só no crédito, de 1 a 12';
    end if;
    v_sum := v_sum + v_amount;
    v_count := v_count + 1;
  end loop;

  if abs(v_sum - round(p_expected, 2)) > 0.01 then
    raise exception 'as formas de pagamento somam R$ %, mas o valor é R$ %',
      replace(to_char(v_sum, 'FM999999990.00'), '.', ','), replace(to_char(p_expected, 'FM999999990.00'), '.', ',');
  end if;

  select cash_control into v_cash_control from public.tenants where id = p_tenant_id;

  for v_entry in select * from jsonb_array_elements(p_payments)
  loop
    v_method := v_entry ->> 'method';
    v_amount := round((v_entry ->> 'amount')::numeric, 2);
    v_installments := coalesce((v_entry ->> 'installments')::integer, 1);
    v_session_id := null;

    if v_method = 'credito_loja' then
      if p_customer_id is null then
        raise exception 'crédito da loja exige o cliente na venda';
      end if;
      perform public.fn_customer_credit_apply(
        p_tenant_id, p_customer_id,
        case when p_direction = 'in' then -v_amount else v_amount end,
        coalesce(p_note, 'Pagamento') || case when p_direction = 'in' then ' (uso do crédito)' else ' (crédito gerado)' end
      );
    end if;

    if v_method = 'dinheiro' and v_cash_control then
      select id into v_session_id from public.cash_sessions
        where tenant_id = p_tenant_id and store_id = p_store_id and status = 'open'
        for update;
      if v_session_id is null then
        raise exception 'abra o caixa desta loja para movimentar dinheiro';
      end if;
      insert into public.cash_session_movements (session_id, kind, amount, note, reference_id, created_by)
      values (
        v_session_id,
        case when p_direction = 'in' then 'sale' else 'refund' end::public.cash_movement_kind,
        case when p_direction = 'in' then v_amount else -v_amount end,
        coalesce(p_note, 'Pagamento em dinheiro'), p_document_id, auth.uid()
      );
    end if;

    insert into public.payments (tenant_id, store_id, document_type, document_id, direction, method, amount, installments, cash_session_id, customer_id, created_by)
    values (p_tenant_id, p_store_id, p_document_type, p_document_id, p_direction, v_method::public.payment_method, v_amount, v_installments, v_session_id, p_customer_id, auth.uid());

    v_summary := v_method;
  end loop;

  return case when v_count = 0 then 'outro' when v_count > 1 then 'dividido' else v_summary end;
end;
$function$;

-- 2 ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_transfer_receive(p_transfer_id uuid, p_items jsonb, p_discrepancy_reason text DEFAULT NULL::text, p_discrepancy_detail text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_tenant_id uuid;
  v_transfer public.transfers%rowtype;
  v_item jsonb;
  v_transfer_item_id uuid;
  v_qty_received integer;
  v_product_id uuid;
  v_before integer;
  v_after integer;
  v_has_discrepancy boolean;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('stock', 2) then
    raise exception 'not authorized';
  end if;

  select * into v_transfer from public.transfers where id = p_transfer_id and tenant_id = v_tenant_id for update;
  if not found then
    raise exception 'transferência não encontrada';
  end if;
  if v_transfer.status <> 'dispatched' then
    raise exception 'transferência já conferida';
  end if;

  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'itens inválidos';
  end if;
  if (select count(*) from jsonb_array_elements(p_items))
     <> (select count(distinct e ->> 'transfer_item_id') from jsonb_array_elements(p_items) e) then
    raise exception 'item repetido na conferência';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_transfer_item_id := (v_item ->> 'transfer_item_id')::uuid;
    v_qty_received := (v_item ->> 'qty_received')::integer;

    select product_id into v_product_id from public.transfer_items where id = v_transfer_item_id and transfer_id = p_transfer_id;
    if not found then
      raise exception 'item de transferência inválido';
    end if;
    if v_qty_received is null or v_qty_received < 0 or v_qty_received > (select qty_sent from public.transfer_items where id = v_transfer_item_id) then
      raise exception 'quantidade recebida inválida';
    end if;

    update public.transfer_items set qty_received = v_qty_received where id = v_transfer_item_id;

    if v_qty_received > 0 then
      v_before := public.fn_stock_lock(v_product_id, v_transfer.destination_store_id);
      v_after := v_before + v_qty_received;

      insert into public.stock_balances (product_id, store_id, qty)
      values (v_product_id, v_transfer.destination_store_id, v_after)
      on conflict (product_id, store_id) do update set qty = v_after, updated_at = now();

      insert into public.stock_movements (tenant_id, store_id, product_id, kind, qty, before_qty, after_qty, reference_type, reference_id, created_by)
      values (v_tenant_id, v_transfer.destination_store_id, v_product_id, 'transfer', v_qty_received, v_before, v_after, 'transfer', p_transfer_id, auth.uid());
    end if;
  end loop;

  select exists (select 1 from public.transfer_items where transfer_id = p_transfer_id and coalesce(qty_received, -1) <> qty_sent) into v_has_discrepancy;

  update public.transfers
  set status = case when v_has_discrepancy then 'discrepancy'::public.transfer_status else 'received'::public.transfer_status end,
      received_at = now(),
      discrepancy_reason = case when v_has_discrepancy then p_discrepancy_reason else null end,
      discrepancy_detail = case when v_has_discrepancy then p_discrepancy_detail else null end
  where id = p_transfer_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.fn_purchase_order_receive(p_order_id uuid, p_items jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_tenant_id uuid;
  v_order public.purchase_orders%rowtype;
  v_item jsonb;
  v_order_item_id uuid;
  v_product_id uuid;
  v_qty_received integer;
  v_unit_cost numeric;
  v_before integer;
  v_after integer;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('purchasing', 2) then
    raise exception 'not authorized';
  end if;

  select * into v_order from public.purchase_orders where id = p_order_id and tenant_id = v_tenant_id for update;
  if not found then
    raise exception 'pedido não encontrado';
  end if;
  if v_order.status <> 'sent' then
    raise exception 'pedido já recebido';
  end if;

  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'itens inválidos';
  end if;
  if (select count(*) from jsonb_array_elements(p_items))
     <> (select count(distinct e ->> 'order_item_id') from jsonb_array_elements(p_items) e) then
    raise exception 'item repetido na conferência';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_order_item_id := (v_item ->> 'order_item_id')::uuid;
    v_qty_received := (v_item ->> 'qty_received')::integer;

    select product_id, coalesce((v_item ->> 'unit_cost')::numeric, unit_cost) into v_product_id, v_unit_cost
    from public.purchase_order_items where id = v_order_item_id and order_id = p_order_id;
    if not found then
      raise exception 'item de pedido inválido';
    end if;
    if v_qty_received is null or v_qty_received < 0 then
      raise exception 'quantidade recebida inválida';
    end if;
    if v_unit_cost is null or v_unit_cost < 0 then
      raise exception 'custo unitário inválido';
    end if;

    update public.purchase_order_items set qty_received = v_qty_received, unit_cost = v_unit_cost where id = v_order_item_id;

    if v_qty_received > 0 then
      v_before := public.fn_stock_lock(v_product_id, v_order.store_id);
      v_after := v_before + v_qty_received;

      insert into public.stock_balances (product_id, store_id, qty)
      values (v_product_id, v_order.store_id, v_after)
      on conflict (product_id, store_id) do update set qty = v_after, updated_at = now();

      insert into public.stock_movements (tenant_id, store_id, product_id, kind, qty, unit_cost, before_qty, after_qty, reference_type, reference_id, created_by)
      values (v_tenant_id, v_order.store_id, v_product_id, 'entry', v_qty_received, v_unit_cost, v_before, v_after, 'purchase_order', p_order_id, auth.uid());
    end if;
  end loop;

  update public.purchase_orders set status = 'received', received_at = now() where id = p_order_id;
end;
$function$;

-- 3 ---------------------------------------------------------------
-- O servidor resolve o tenant e o usuário pela sessão e chama estas com
-- service_role. Mesma regra do estorno antigo: só um débito real, recente
-- e ainda não estornado.
create or replace function public.fn_ai_refund_credits_for(p_tenant_id uuid, p_op_id text)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  v_debit public.ai_credit_ledger%rowtype;
  v_plan integer;
  v_extra integer;
begin
  select * into v_debit from public.ai_credit_ledger
    where tenant_id = p_tenant_id and op_id = p_op_id and delta < 0
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
    where id = p_tenant_id
    returning ai_credit_plan_balance, ai_credit_extra_balance into v_plan, v_extra;

  insert into public.ai_credit_ledger (tenant_id, delta, balance_after, reason, op_id)
  values (p_tenant_id, -v_debit.delta, v_plan + v_extra, 'Estorno: falha em ' || p_op_id, p_op_id);

  return v_plan + v_extra;
end;
$$;

create or replace function public.fn_write_ai_usage_for(
  p_tenant_id uuid, p_user_id uuid, p_op_id text, p_model text, p_tokens_in integer, p_tokens_out integer,
  p_cost_usd numeric, p_status text, p_error_message text default null, p_latency_ms integer default null
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if p_status not in ('ok', 'error') then
    raise exception 'status inválido';
  end if;
  insert into public.ai_usage_log (tenant_id, op_id, model, tokens_in, tokens_out, cost_usd, status, error_message, latency_ms, created_by)
  values (p_tenant_id, p_op_id, p_model, p_tokens_in, p_tokens_out, p_cost_usd, p_status, left(p_error_message, 1000), p_latency_ms, p_user_id);
end;
$$;

revoke execute on function public.fn_ai_refund_credits_for(uuid, text) from public, anon, authenticated;
revoke execute on function public.fn_write_ai_usage_for(uuid, uuid, text, text, integer, integer, numeric, text, text, integer) from public, anon, authenticated;
grant execute on function public.fn_ai_refund_credits_for(uuid, text) to service_role;
grant execute on function public.fn_write_ai_usage_for(uuid, uuid, text, text, integer, integer, numeric, text, text, integer) to service_role;


-- 4 ---------------------------------------------------------------
-- Fila global: o servidor pega os avisos pendentes de todas as redes (cada
-- um com os proprietários da própria rede).
create or replace function public.fn_claim_notification_emails_svc(p_limit integer default 20)
returns table (id uuid, kind text, title text, message text, created_at timestamptz, recipients text[])
language plpgsql security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  return query
  with pending as (
    select n.id
    from public.notifications n
    join public.notification_preferences np
      on np.tenant_id = n.tenant_id
     and np.email
     and np.rule = case n.kind
       when 'out_of_stock' then 'low_stock'
       when 'low_stock' then 'below_min'
       when 'access_request' then 'access_request'
       when 'cash_discrepancy' then 'cash_discrepancy'
     end
    where n.emailed_at is null
      and n.created_at > now() - interval '24 hours'
    order by n.created_at
    limit least(greatest(coalesce(p_limit, 20), 1), 50)
    for update of n skip locked
  ),
  claimed as (
    update public.notifications n set emailed_at = now()
    from pending where n.id = pending.id
    returning n.id, n.tenant_id, n.kind, n.title, n.message, n.created_at
  )
  select c.id, c.kind, c.title, c.message, c.created_at,
    coalesce((
      select array_agg(distinct u.email::text)
      from public.store_users su
      join auth.users u on u.id = su.user_id
      where su.tenant_id = c.tenant_id and su.role = 'proprietario' and su.status = 'active' and u.email is not null
    ), '{}')
  from claimed c;
end;
$$;

create or replace function public.fn_record_notification_email_result_svc(p_id uuid, p_error text)
returns void
language sql security definer
set search_path = public
as $$
  update public.notifications set email_error = left(p_error, 500) where id = p_id;
$$;

revoke execute on function public.fn_claim_notification_emails_svc(integer) from public, anon, authenticated;
revoke execute on function public.fn_record_notification_email_result_svc(uuid, text) from public, anon, authenticated;
grant execute on function public.fn_claim_notification_emails_svc(integer) to service_role;
grant execute on function public.fn_record_notification_email_result_svc(uuid, text) to service_role;


-- 5 ---------------------------------------------------------------
drop policy if exists plans_staff_all on public.plans;
revoke insert, update, delete on public.plans from anon, authenticated;

-- 6 ---------------------------------------------------------------
drop policy if exists products_write on public.products;
create policy products_insert on public.products
  for insert to authenticated
  with check (tenant_id = public.auth_tenant_id() and public.has_access('catalog', 2));
create policy products_update on public.products
  for update to authenticated
  using (tenant_id = public.auth_tenant_id() and public.has_access('catalog', 2))
  with check (tenant_id = public.auth_tenant_id() and public.has_access('catalog', 2));
revoke delete on public.products from anon, authenticated;

drop policy if exists notifications_update on public.notifications;
revoke update on public.notifications from anon, authenticated;

-- 7 ---------------------------------------------------------------
create or replace function public.fn_check_location_store()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.store_id is not null and not exists (select 1 from public.stores where id = new.store_id and tenant_id = new.tenant_id) then
    raise exception 'loja inválida';
  end if;
  return new;
end;
$$;
revoke execute on function public.fn_check_location_store() from public, anon, authenticated;

drop trigger if exists locations_same_tenant_store on public.locations;
create trigger locations_same_tenant_store
  before insert or update of store_id, tenant_id on public.locations
  for each row execute function public.fn_check_location_store();

-- 8 ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_start_impersonation(p_tenant_id uuid, p_reason text, p_ticket_ref text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_session_id uuid;
begin
  if not public.has_platform_role('{super_admin,suporte}') then
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
  if exists (select 1 from public.profiles where id = p_owner_user_id and tenant_id is not null) then
    raise exception 'este usuário já pertence a outra rede';
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

-- 9 ---------------------------------------------------------------
create index if not exists payments_store_id_idx on public.payments (store_id);
create index if not exists payments_cash_session_id_idx on public.payments (cash_session_id) where cash_session_id is not null;
create index if not exists payments_customer_id_idx on public.payments (customer_id) where customer_id is not null;
create index if not exists notifications_store_id_idx on public.notifications (store_id) where store_id is not null;
create index if not exists stock_movements_reference_idx on public.stock_movements (reference_type, reference_id) where reference_id is not null;
create index if not exists stock_movements_created_by_idx on public.stock_movements (created_by);
create index if not exists sales_salesperson_id_idx on public.sales (salesperson_id);
