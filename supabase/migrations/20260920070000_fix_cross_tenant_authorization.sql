-- Fix: funções security definer de Fase 3/4 validavam store_id (quando
-- validavam) mas nunca product_id/customer_id/location_id/category_id
-- contra o tenant do chamador — um usuário autenticado podia passar o uuid
-- de um produto/loja/cliente de OUTRO tenant e a função, rodando com
-- security definer (bypass de RLS), aceitava. Achado por revisão de
-- segurança automática pós-push. Fecha o buraco em todas as 6 funções
-- afetadas, recriando-as (nunca editar migration já aplicada).

-- ============================================================
-- fn_stock_entry — adiciona checagem de tenant em product_id
-- ============================================================
create or replace function public.fn_stock_entry(
  p_store_id uuid, p_product_id uuid, p_qty integer, p_unit_cost numeric, p_notes text default null
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
  if p_qty <= 0 then
    raise exception 'quantidade precisa ser positiva';
  end if;
  if not exists (select 1 from public.stores where id = p_store_id and tenant_id = v_tenant_id) then
    raise exception 'loja inválida';
  end if;
  if not exists (select 1 from public.products where id = p_product_id and tenant_id = v_tenant_id) then
    raise exception 'produto inválido';
  end if;

  select coalesce((select qty from public.stock_balances where product_id = p_product_id and store_id = p_store_id), 0) into v_before;
  v_after := v_before + p_qty;

  insert into public.stock_balances (product_id, store_id, qty)
  values (p_product_id, p_store_id, v_after)
  on conflict (product_id, store_id) do update set qty = v_after, updated_at = now();

  insert into public.stock_movements (tenant_id, store_id, product_id, kind, qty, unit_cost, before_qty, after_qty, reason, created_by)
  values (v_tenant_id, p_store_id, p_product_id, 'entry', p_qty, p_unit_cost, v_before, v_after, p_notes, auth.uid())
  returning id into v_movement_id;

  return v_movement_id;
end;
$$;

-- ============================================================
-- fn_stock_adjustment — faltava checagem de store_id E product_id
-- ============================================================
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
  if not exists (select 1 from public.products where id = p_product_id and tenant_id = v_tenant_id) then
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

  -- TODO (Fase 6, notificações): avisar o financeiro quando |diff * custo| > R$200.

  return v_movement_id;
end;
$$;

-- ============================================================
-- fn_transfer_dispatch — faltava checagem de tenant em origin/destination
-- store_id e em product_id de cada item
-- ============================================================
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
    if not exists (select 1 from public.products where id = v_product_id and tenant_id = v_tenant_id) then
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
  end loop;

  return v_transfer_id;
end;
$$;

-- ============================================================
-- fn_stock_count_submit — faltava checagem de tenant em store_id,
-- location_id, category_id e product_id de cada item
-- ============================================================
create or replace function public.fn_stock_count_submit(
  p_store_id uuid, p_location_id uuid, p_category_id uuid, p_items jsonb, p_reason text, p_justification text
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_count_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_counted integer;
  v_system integer;
  v_has_divergence boolean := false;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('stock', 2) then
    raise exception 'not authorized';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'informe ao menos um item contado';
  end if;
  if not exists (select 1 from public.stores where id = p_store_id and tenant_id = v_tenant_id) then
    raise exception 'loja inválida';
  end if;
  if p_location_id is not null and not exists (select 1 from public.locations where id = p_location_id and tenant_id = v_tenant_id) then
    raise exception 'local inválido';
  end if;
  if p_category_id is not null and not exists (select 1 from public.categories where id = p_category_id and tenant_id = v_tenant_id) then
    raise exception 'categoria inválida';
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
    v_counted := (v_item ->> 'counted_qty')::integer;
    select coalesce((select qty from public.stock_balances where product_id = v_product_id and store_id = p_store_id), 0) into v_system;
    if v_counted <> v_system then
      v_has_divergence := true;
    end if;
  end loop;

  if v_has_divergence and length(coalesce(p_justification, '')) < 20 then
    raise exception 'justificativa precisa ter pelo menos 20 caracteres quando há divergência';
  end if;

  insert into public.stock_counts (tenant_id, store_id, location_id, category_id, reason, justification, responsible_user_id, closed_at, created_by)
  values (v_tenant_id, p_store_id, p_location_id, p_category_id, p_reason, p_justification, auth.uid(), now(), auth.uid())
  returning id into v_count_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_counted := (v_item ->> 'counted_qty')::integer;
    select coalesce((select qty from public.stock_balances where product_id = v_product_id and store_id = p_store_id), 0) into v_system;

    insert into public.stock_count_items (count_id, product_id, system_qty, counted_qty)
    values (v_count_id, v_product_id, v_system, v_counted);

    if v_counted <> v_system then
      insert into public.stock_balances (product_id, store_id, qty)
      values (v_product_id, p_store_id, v_counted)
      on conflict (product_id, store_id) do update set qty = v_counted, updated_at = now();

      insert into public.stock_movements (tenant_id, store_id, product_id, kind, qty, before_qty, after_qty, reference_type, reference_id, reason, justification, created_by)
      values (v_tenant_id, p_store_id, v_product_id, 'count', v_counted - v_system, v_system, v_counted, 'stock_count', v_count_id, p_reason, p_justification, auth.uid());
    end if;
  end loop;

  return v_count_id;
end;
$$;

-- ============================================================
-- fn_cash_session_open — faltava checagem de tenant em store_id
-- ============================================================
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
  if not exists (select 1 from public.stores where id = p_store_id and tenant_id = v_tenant_id) then
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

-- ============================================================
-- fn_confirm_sale — faltava checagem de tenant em store_id, customer_id
-- e product_id de cada item
-- ============================================================
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

  -- valida estoque de todos os itens ANTES de gravar qualquer coisa
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
