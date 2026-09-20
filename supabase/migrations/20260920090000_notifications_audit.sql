-- Fase 6 — notificações e auditoria.
--
-- audit_log cobre o que NENHUMA outra tabela já registra por natureza
-- (stock_movements/sales/transfers/purchase_orders já SÃO o histórico de
-- operação — duplicar isso em audit_log seria redundante). audit_log foca
-- em preço, esquema, promoção, configuração e usuário.
--
-- notifications: ruptura de estoque é a única notificação automática desta
-- fase — dispara quando uma baixa de estoque cruza o `min_stock` (estava
-- acima, ficou igual ou abaixo). Vendas/ajustes/transferências que só
-- ficam mais fundo abaixo do mínimo não repetem o aviso.

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  kind text not null, -- price | schema | promo | settings | user | supplier
  message text not null,
  target_type text,
  target_id uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index audit_log_tenant_id_idx on public.audit_log (tenant_id, created_at desc);

create function public.fn_write_audit(p_kind text, p_message text, p_target_type text default null, p_target_id uuid default null)
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
  insert into public.audit_log (tenant_id, kind, message, target_type, target_id, created_by)
  values (v_tenant_id, p_kind, p_message, p_target_type, p_target_id, auth.uid());
end;
$$;
grant execute on function public.fn_write_audit(text, text, text, uuid) to authenticated;

alter table public.audit_log enable row level security;
create policy audit_log_select on public.audit_log
  for select to authenticated using (tenant_id = public.auth_tenant_id() and public.has_access('people', 1));
grant select on public.audit_log to authenticated;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  kind text not null, -- low_stock | out_of_stock
  title text not null,
  message text not null,
  target_type text,
  target_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_tenant_id_idx on public.notifications (tenant_id, created_at desc);

create table public.notification_preferences (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  rule text not null, -- matches the rule keys used by the settings screen
  email boolean not null default false,
  primary key (tenant_id, rule)
);

alter table public.notifications enable row level security;
create policy notifications_select on public.notifications
  for select to authenticated using (tenant_id = public.auth_tenant_id());
create policy notifications_update on public.notifications
  for update to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());
grant select, update on public.notifications to authenticated;

alter table public.notification_preferences enable row level security;
create policy notification_preferences_all on public.notification_preferences
  for all to authenticated
  using (tenant_id = public.auth_tenant_id() and public.has_access('people', 2))
  with check (tenant_id = public.auth_tenant_id() and public.has_access('people', 2));
grant select, insert, update, delete on public.notification_preferences to authenticated;

create function public.fn_mark_notifications_read(p_ids uuid[] default null)
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
  update public.notifications
  set read_at = now()
  where tenant_id = v_tenant_id and read_at is null
    and (p_ids is null or id = any(p_ids));
end;
$$;
grant execute on function public.fn_mark_notifications_read(uuid[]) to authenticated;

-- ============================================================
-- fn_notify_low_stock — inserida por quem decrementa estoque, sempre que a
-- baixa cruza o limiar (estava acima do mínimo, ficou igual ou abaixo).
-- ============================================================
create function public.fn_notify_low_stock(
  p_tenant_id uuid, p_store_id uuid, p_product_id uuid, p_before_qty integer, p_after_qty integer, p_min_stock integer
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_product_name text;
  v_store_name text;
begin
  if p_min_stock <= 0 or p_before_qty > p_min_stock and p_after_qty > p_min_stock then
    return;
  end if;
  if p_before_qty <= p_min_stock then
    return; -- já estava em alerta antes desta baixa — não repete
  end if;

  select name into v_product_name from public.products where id = p_product_id;
  select name into v_store_name from public.stores where id = p_store_id;

  insert into public.notifications (tenant_id, store_id, kind, title, message, target_type, target_id)
  values (
    p_tenant_id, p_store_id,
    case when p_after_qty = 0 then 'out_of_stock' else 'low_stock' end,
    case when p_after_qty = 0 then 'Ruptura de estoque' else 'Estoque abaixo do mínimo' end,
    format('%s em %s caiu para %s unidade(s) (mínimo %s).', coalesce(v_product_name, 'Produto'), coalesce(v_store_name, 'loja'), p_after_qty, p_min_stock),
    'product', p_product_id
  );
end;
$$;

-- Retrofit: chama fn_notify_low_stock nas 3 funções que decrementam saldo
-- de venda/ajuste/transferência (recriadas via create or replace — nunca
-- se edita uma migration já aplicada).
create or replace function public.fn_stock_adjustment(
  p_store_id uuid, p_product_id uuid, p_counted_qty integer, p_reason text, p_justification text
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_before integer;
  v_diff integer;
  v_movement_id uuid;
  v_min_stock integer;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('stock', 2) then
    raise exception 'not authorized';
  end if;
  if p_counted_qty < 0 then
    raise exception 'contagem não pode ser negativa';
  end if;
  if length(coalesce(p_justification, '')) < 20 then
    raise exception 'justificativa precisa ter pelo menos 20 caracteres';
  end if;
  if not exists (select 1 from public.stores where id = p_store_id and tenant_id = v_tenant_id) then
    raise exception 'loja inválida';
  end if;
  select min_stock into v_min_stock from public.products where id = p_product_id and tenant_id = v_tenant_id;
  if not found then
    raise exception 'produto inválido';
  end if;

  select coalesce((select qty from public.stock_balances where product_id = p_product_id and store_id = p_store_id), 0) into v_before;
  v_diff := p_counted_qty - v_before;
  if v_diff = 0 then
    raise exception 'sem divergência — nada para ajustar';
  end if;

  insert into public.stock_balances (product_id, store_id, qty)
  values (p_product_id, p_store_id, p_counted_qty)
  on conflict (product_id, store_id) do update set qty = p_counted_qty, updated_at = now();

  insert into public.stock_movements (tenant_id, store_id, product_id, kind, qty, before_qty, after_qty, reason, justification, created_by)
  values (v_tenant_id, p_store_id, p_product_id, 'adjustment', v_diff, v_before, p_counted_qty, p_reason, p_justification, auth.uid())
  returning id into v_movement_id;

  if v_diff < 0 then
    perform public.fn_notify_low_stock(v_tenant_id, p_store_id, p_product_id, v_before, p_counted_qty, v_min_stock);
  end if;

  return v_movement_id;
end;
$$;

create or replace function public.fn_transfer_dispatch(
  p_origin_store_id uuid, p_destination_store_id uuid, p_items jsonb,
  p_reason text, p_carrier text default null, p_notes text default null
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_transfer_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_qty integer;
  v_before integer;
  v_after integer;
  v_min_stock integer;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('stock', 2) then
    raise exception 'not authorized';
  end if;
  if p_origin_store_id = p_destination_store_id then
    raise exception 'origem e destino não podem ser a mesma loja';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'informe ao menos um item';
  end if;
  if not exists (select 1 from public.stores where id = p_origin_store_id and tenant_id = v_tenant_id) then
    raise exception 'loja de origem inválida';
  end if;
  if not exists (select 1 from public.stores where id = p_destination_store_id and tenant_id = v_tenant_id) then
    raise exception 'loja de destino inválida';
  end if;

  insert into public.transfers (tenant_id, origin_store_id, destination_store_id, reason, carrier, notes, responsible_user_id, created_by)
  values (v_tenant_id, p_origin_store_id, p_destination_store_id, p_reason, p_carrier, p_notes, auth.uid(), auth.uid())
  returning id into v_transfer_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'qty')::integer;
    if v_qty <= 0 then
      raise exception 'quantidade precisa ser positiva';
    end if;
    select min_stock into v_min_stock from public.products where id = v_product_id and tenant_id = v_tenant_id;
    if not found then
      raise exception 'produto inválido';
    end if;

    select coalesce((select qty from public.stock_balances where product_id = v_product_id and store_id = p_origin_store_id), 0) into v_before;
    if v_before < v_qty then
      raise exception 'saldo insuficiente na origem para o produto %', v_product_id;
    end if;
    v_after := v_before - v_qty;

    insert into public.stock_balances (product_id, store_id, qty)
    values (v_product_id, p_origin_store_id, v_after)
    on conflict (product_id, store_id) do update set qty = v_after, updated_at = now();

    insert into public.stock_movements (tenant_id, store_id, product_id, kind, qty, before_qty, after_qty, reference_type, reference_id, reason, created_by)
    values (v_tenant_id, p_origin_store_id, v_product_id, 'transfer', -v_qty, v_before, v_after, 'transfer', v_transfer_id, p_reason, auth.uid());

    insert into public.transfer_items (transfer_id, product_id, qty_sent)
    values (v_transfer_id, v_product_id, v_qty);

    perform public.fn_notify_low_stock(v_tenant_id, p_origin_store_id, v_product_id, v_before, v_after, v_min_stock);
  end loop;

  return v_transfer_id;
end;
$$;

create or replace function public.fn_confirm_sale(
  p_store_id uuid, p_customer_id uuid, p_payment_method text, p_installments integer,
  p_cash_session_id uuid, p_notes text, p_items jsonb, p_order_discount_amount numeric default 0
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_sale_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_qty integer;
  v_unit_price numeric;
  v_discount_pct numeric;
  v_product public.products%rowtype;
  v_variant text;
  v_line_total numeric;
  v_subtotal numeric := 0;
  v_total numeric;
  v_before integer;
  v_after integer;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('pos', 2) then
    raise exception 'not authorized';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'informe ao menos um item';
  end if;
  if not exists (select 1 from public.stores where id = p_store_id and tenant_id = v_tenant_id) then
    raise exception 'loja inválida';
  end if;
  if p_customer_id is not null and not exists (select 1 from public.customers where id = p_customer_id and tenant_id = v_tenant_id) then
    raise exception 'cliente inválido';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) elem
    where not exists (
      select 1 from public.products where id = (elem ->> 'product_id')::uuid and tenant_id = v_tenant_id
    )
  ) then
    raise exception 'produto inválido';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'qty')::integer;
    select coalesce((select qty from public.stock_balances where product_id = v_product_id and store_id = p_store_id), 0) into v_before;
    if v_before < v_qty then
      raise exception 'saldo insuficiente para o produto %', v_product_id;
    end if;
  end loop;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item ->> 'qty')::integer;
    v_unit_price := (v_item ->> 'unit_price')::numeric;
    v_discount_pct := coalesce((v_item ->> 'discount_pct')::numeric, 0);
    v_subtotal := v_subtotal + (v_qty * v_unit_price);
  end loop;
  v_total := v_subtotal
    - (select coalesce(sum((elem ->> 'qty')::integer * (elem ->> 'unit_price')::numeric * coalesce((elem ->> 'discount_pct')::numeric, 0) / 100), 0)
       from jsonb_array_elements(p_items) elem)
    - p_order_discount_amount;

  insert into public.sales (tenant_id, store_id, customer_id, salesperson_id, subtotal, discount_amount, total, payment_method, installments, notes, created_by)
  values (v_tenant_id, p_store_id, p_customer_id, auth.uid(), v_subtotal,
    (v_subtotal - v_total), v_total, p_payment_method::public.payment_method, p_installments, p_notes, auth.uid())
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'qty')::integer;
    v_unit_price := (v_item ->> 'unit_price')::numeric;
    v_discount_pct := coalesce((v_item ->> 'discount_pct')::numeric, 0);
    v_line_total := v_qty * v_unit_price * (1 - v_discount_pct / 100);

    select * into v_product from public.products where id = v_product_id;
    select string_agg(value, ' · ') into v_variant
      from jsonb_each_text(coalesce(v_product.attrs, '{}'::jsonb))
      where value is not null and value <> '';

    insert into public.sale_items (sale_id, product_id, sku_snapshot, name_snapshot, variant_snapshot, qty, unit_price, discount_pct, total)
    values (v_sale_id, v_product_id, v_product.sku, v_product.name, v_variant, v_qty, v_unit_price, v_discount_pct, v_line_total);

    select coalesce((select qty from public.stock_balances where product_id = v_product_id and store_id = p_store_id), 0) into v_before;
    v_after := v_before - v_qty;

    insert into public.stock_balances (product_id, store_id, qty)
    values (v_product_id, p_store_id, v_after)
    on conflict (product_id, store_id) do update set qty = v_after, updated_at = now();

    insert into public.stock_movements (tenant_id, store_id, product_id, kind, qty, unit_price, before_qty, after_qty, reference_type, reference_id, created_by)
    values (v_tenant_id, p_store_id, v_product_id, 'sale', -v_qty, v_unit_price, v_before, v_after, 'sale', v_sale_id, auth.uid());

    perform public.fn_notify_low_stock(v_tenant_id, p_store_id, v_product_id, v_before, v_after, v_product.min_stock);
  end loop;

  if p_payment_method = 'dinheiro' and p_cash_session_id is not null then
    if exists (select 1 from public.cash_sessions where id = p_cash_session_id and tenant_id = v_tenant_id and status = 'open') then
      insert into public.cash_session_movements (session_id, kind, amount, note, reference_id, created_by)
      values (p_cash_session_id, 'sale', v_total, 'Venda em dinheiro', v_sale_id, auth.uid());
    end if;
  end if;

  return v_sale_id;
end;
$$;
