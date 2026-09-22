-- ============================================================
-- fn_purchase_order_receive ganha custo unitário opcional por item —
-- /stock/receive/match precisa poder gravar o custo da nota (quando
-- aceito) em vez do custo original do pedido, sem quebrar o caller
-- existente (fn_purchase_orders.jsx / recebimento simples), que não
-- manda `unit_cost` e continua usando o preço do pedido como antes.
-- ============================================================

create or replace function public.fn_purchase_order_receive(p_order_id uuid, p_items jsonb)
returns void
language plpgsql security definer
set search_path = public
as $$
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

  select * into v_order from public.purchase_orders where id = p_order_id and tenant_id = v_tenant_id;
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

    update public.purchase_order_items set qty_received = v_qty_received, unit_cost = v_unit_cost where id = v_order_item_id;

    if v_qty_received > 0 then
      select coalesce((select qty from public.stock_balances where product_id = v_product_id and store_id = v_order.store_id), 0) into v_before;
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
$$;
