-- Estoque atômico + validação de entrada nas funções que mexem saldo.
-- Antes: toda função lia o saldo sem trava e gravava valor absoluto; duas
-- operações simultâneas perdiam uma baixa. Agora fn_stock_lock garante a
-- linha e trava (for update) até o fim da transação.
-- fn_confirm_sale: preço vem do cadastro, qty > 0, desconto 0–100%, total
-- >= 0, caixa precisa ser da mesma loja.
-- fn_transfer_receive / fn_purchase_order_receive: trava o documento (evita
-- recebimento duplo) e limita qty recebida (0..enviado / >= 0).

create or replace function public.fn_stock_lock(p_product_id uuid, p_store_id uuid)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_qty integer;
begin
  insert into public.stock_balances (product_id, store_id, qty)
  values (p_product_id, p_store_id, 0)
  on conflict (product_id, store_id) do nothing;
  select qty into v_qty from public.stock_balances
    where product_id = p_product_id and store_id = p_store_id
    for update;
  return v_qty;
end;
$$;
revoke execute on function public.fn_stock_lock(uuid, uuid) from public, anon, authenticated;

create unique index if not exists cash_sessions_one_open_per_store
  on public.cash_sessions (store_id) where status = 'open';

CREATE OR REPLACE FUNCTION public.fn_stock_entry(p_store_id uuid, p_product_id uuid, p_qty integer, p_unit_cost numeric, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  v_before := public.fn_stock_lock(p_product_id, p_store_id);
  v_after := v_before + p_qty;

  insert into public.stock_balances (product_id, store_id, qty)
  values (p_product_id, p_store_id, v_after)
  on conflict (product_id, store_id) do update set qty = v_after, updated_at = now();

  insert into public.stock_movements (tenant_id, store_id, product_id, kind, qty, unit_cost, before_qty, after_qty, reason, created_by)
  values (v_tenant_id, p_store_id, p_product_id, 'entry', p_qty, p_unit_cost, v_before, v_after, p_notes, auth.uid())
  returning id into v_movement_id;

  return v_movement_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.fn_stock_adjustment(p_store_id uuid, p_product_id uuid, p_counted_qty integer, p_reason text, p_justification text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  v_before := public.fn_stock_lock(p_product_id, p_store_id);
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
$function$;

CREATE OR REPLACE FUNCTION public.fn_stock_count_submit(p_store_id uuid, p_location_id uuid, p_category_id uuid, p_items jsonb, p_reason text, p_justification text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  if exists (select 1 from jsonb_array_elements(p_items) elem where coalesce((elem ->> 'counted_qty')::integer, -1) < 0) then
    raise exception 'contagem não pode ser negativa';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_counted := (v_item ->> 'counted_qty')::integer;
    v_system := public.fn_stock_lock(v_product_id, p_store_id);
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
    v_system := public.fn_stock_lock(v_product_id, p_store_id);

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
$function$;

CREATE OR REPLACE FUNCTION public.fn_transfer_dispatch(p_origin_store_id uuid, p_destination_store_id uuid, p_items jsonb, p_reason text, p_carrier text DEFAULT NULL::text, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

    v_before := public.fn_stock_lock(v_product_id, p_origin_store_id);
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
$function$;

CREATE OR REPLACE FUNCTION public.fn_bulk_import_products(p_store_id uuid, p_items jsonb, p_on_duplicate text DEFAULT 'update'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_tenant_id uuid;
  v_item jsonb;
  v_category_id uuid;
  v_existing_id uuid;
  v_created integer := 0;
  v_updated integer := 0;
  v_skipped integer := 0;
  v_errors jsonb := '[]'::jsonb;
  v_sku text;
  v_product_id uuid;
  v_qty integer;
  v_before integer;
  v_after integer;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('catalog', 2) then
    raise exception 'not authorized';
  end if;
  if p_on_duplicate not in ('update', 'skip') then
    raise exception 'ação para duplicados inválida';
  end if;
  if not exists (select 1 from public.stores where id = p_store_id and tenant_id = v_tenant_id) then
    raise exception 'loja inválida';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_sku := trim(v_item ->> 'sku');
    if v_sku = '' or v_sku is null then
      v_errors := v_errors || jsonb_build_object('sku', coalesce(v_sku, ''), 'error', 'SKU em branco');
      continue;
    end if;

    select id into v_category_id from public.categories where tenant_id = v_tenant_id and code = upper(v_item ->> 'category_code');
    if v_category_id is null then
      v_errors := v_errors || jsonb_build_object('sku', v_sku, 'error', 'categoria "' || (v_item ->> 'category_code') || '" não encontrada');
      continue;
    end if;

    if coalesce((v_item ->> 'sale_price')::numeric, 0) <= 0 then
      v_errors := v_errors || jsonb_build_object('sku', v_sku, 'error', 'preço de venda precisa ser maior que zero');
      continue;
    end if;

    select id into v_existing_id from public.products where tenant_id = v_tenant_id and sku = v_sku;

    if v_existing_id is not null then
      if p_on_duplicate = 'skip' then
        v_skipped := v_skipped + 1;
        continue;
      end if;
      update public.products set
        category_id = v_category_id,
        barcode = nullif(v_item ->> 'barcode', ''),
        brand = v_item ->> 'brand',
        name = v_item ->> 'name',
        cost_price = coalesce((v_item ->> 'cost_price')::numeric, 0),
        sale_price = (v_item ->> 'sale_price')::numeric,
        min_stock = coalesce((v_item ->> 'min_stock')::integer, 0)
      where id = v_existing_id;
      v_product_id := v_existing_id;
      v_updated := v_updated + 1;
    else
      insert into public.products (tenant_id, category_id, sku, barcode, brand, name, cost_price, sale_price, min_stock)
      values (
        v_tenant_id, v_category_id, v_sku, nullif(v_item ->> 'barcode', ''), v_item ->> 'brand', v_item ->> 'name',
        coalesce((v_item ->> 'cost_price')::numeric, 0), (v_item ->> 'sale_price')::numeric, coalesce((v_item ->> 'min_stock')::integer, 0)
      )
      returning id into v_product_id;
      v_created := v_created + 1;
    end if;

    v_qty := coalesce((v_item ->> 'initial_qty')::integer, 0);
    if v_qty > 0 then
      v_before := public.fn_stock_lock(v_product_id, p_store_id);
      v_after := v_before + v_qty;
      insert into public.stock_balances (product_id, store_id, qty)
      values (v_product_id, p_store_id, v_after)
      on conflict (product_id, store_id) do update set qty = v_after, updated_at = now();
      insert into public.stock_movements (tenant_id, store_id, product_id, kind, qty, before_qty, after_qty, reason, created_by)
      values (v_tenant_id, p_store_id, v_product_id, 'entry', v_qty, v_before, v_after, 'Importação em lote', auth.uid());
    end if;
  end loop;

  return jsonb_build_object('created', v_created, 'updated', v_updated, 'skipped', v_skipped, 'errors', v_errors);
end;
$function$;

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

CREATE OR REPLACE FUNCTION public.fn_confirm_sale(p_store_id uuid, p_customer_id uuid, p_payment_method text, p_installments integer, p_cash_session_id uuid, p_notes text, p_items jsonb, p_order_discount_amount numeric DEFAULT 0)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  if exists (
    select 1 from jsonb_array_elements(p_items) elem
    where coalesce((elem ->> 'qty')::integer, 0) <= 0
       or coalesce((elem ->> 'discount_pct')::numeric, 0) not between 0 and 100
  ) then
    raise exception 'item inválido';
  end if;
  if coalesce(p_order_discount_amount, 0) < 0 then
    raise exception 'desconto inválido';
  end if;
  if p_cash_session_id is not null and not exists (
    select 1 from public.cash_sessions where id = p_cash_session_id and tenant_id = v_tenant_id and store_id = p_store_id and status = 'open'
  ) then
    raise exception 'sessão de caixa não encontrada ou já fechada';
  end if;
  -- preço sempre vem do cadastro, nunca do cliente
  select jsonb_agg(elem || jsonb_build_object('unit_price', p.sale_price)) into p_items
    from jsonb_array_elements(p_items) elem
    join public.products p on p.id = (elem ->> 'product_id')::uuid;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'qty')::integer;
    v_before := public.fn_stock_lock(v_product_id, p_store_id);
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
    - coalesce(p_order_discount_amount, 0);
  if v_total < 0 then
    raise exception 'desconto maior que o total';
  end if;

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

    v_before := public.fn_stock_lock(v_product_id, p_store_id);
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
$function$;