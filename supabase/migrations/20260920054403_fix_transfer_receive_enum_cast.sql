-- Fix: CASE retornando texto solto não é atribuível a uma coluna enum
-- (transfer_status) sem cast explícito — Postgres não infere sozinho.

create or replace function public.fn_transfer_receive(
  p_transfer_id uuid, p_items jsonb, p_discrepancy_reason text default null, p_discrepancy_detail text default null
)
returns void
language plpgsql security definer
set search_path = public
as $$
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

  select * into v_transfer from public.transfers where id = p_transfer_id and tenant_id = v_tenant_id;
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

    update public.transfer_items set qty_received = v_qty_received where id = v_transfer_item_id;

    if v_qty_received > 0 then
      select coalesce((select qty from public.stock_balances where product_id = v_product_id and store_id = v_transfer.destination_store_id), 0) into v_before;
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
$$;

grant execute on function public.fn_transfer_receive(uuid, jsonb, text, text) to authenticated;
