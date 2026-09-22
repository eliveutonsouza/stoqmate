-- ============================================================
-- fn_stock_exchange / fn_stock_return — /stock/exchange e /stock/return
-- saem do mock. Faltava a RPC inteira: o botão de confirmar caía no
-- fallback de MovementPage (só navegava, sem gravar nada). `movement_kind`
-- já tinha 'return'/'exchange' no enum desde a Fase 3 (nunca usados).
-- ============================================================

create function public.fn_stock_exchange(
  p_store_id uuid, p_returned_product_id uuid, p_delivered_product_id uuid,
  p_qty integer, p_reason text, p_notes text default null
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
  if p_qty <= 0 then
    raise exception 'quantidade precisa ser positiva';
  end if;
  if p_returned_product_id = p_delivered_product_id then
    raise exception 'itens devolvido e entregue precisam ser diferentes';
  end if;
  if not exists (select 1 from public.stores where id = p_store_id and tenant_id = v_tenant_id) then
    raise exception 'loja inválida';
  end if;

  v_exchange_id := gen_random_uuid();

  -- item devolvido pelo cliente volta ao estoque
  select coalesce((select qty from public.stock_balances where product_id = p_returned_product_id and store_id = p_store_id), 0) into v_before;
  v_after := v_before + p_qty;
  insert into public.stock_balances (product_id, store_id, qty)
  values (p_returned_product_id, p_store_id, v_after)
  on conflict (product_id, store_id) do update set qty = v_after, updated_at = now();
  insert into public.stock_movements (tenant_id, store_id, product_id, kind, qty, before_qty, after_qty, reference_type, reference_id, reason, justification, created_by)
  values (v_tenant_id, p_store_id, p_returned_product_id, 'exchange', p_qty, v_before, v_after, 'exchange', v_exchange_id, p_reason, p_notes, auth.uid());

  -- item entregue ao cliente sai do estoque
  select coalesce((select qty from public.stock_balances where product_id = p_delivered_product_id and store_id = p_store_id), 0) into v_before;
  if v_before < p_qty then
    raise exception 'saldo insuficiente do item entregue';
  end if;
  v_after := v_before - p_qty;
  insert into public.stock_balances (product_id, store_id, qty)
  values (p_delivered_product_id, p_store_id, v_after)
  on conflict (product_id, store_id) do update set qty = v_after, updated_at = now();
  insert into public.stock_movements (tenant_id, store_id, product_id, kind, qty, before_qty, after_qty, reference_type, reference_id, reason, justification, created_by)
  values (v_tenant_id, p_store_id, p_delivered_product_id, 'exchange', -p_qty, v_before, v_after, 'exchange', v_exchange_id, p_reason, p_notes, auth.uid());

  return v_exchange_id;
end;
$$;

create function public.fn_stock_return(
  p_store_id uuid, p_product_id uuid, p_qty integer, p_reason text, p_restock boolean, p_notes text default null
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

  select coalesce((select qty from public.stock_balances where product_id = p_product_id and store_id = p_store_id), 0) into v_before;

  if p_restock then
    v_after := v_before + p_qty;
    insert into public.stock_balances (product_id, store_id, qty)
    values (p_product_id, p_store_id, v_after)
    on conflict (product_id, store_id) do update set qty = v_after, updated_at = now();
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

grant execute on function public.fn_stock_exchange(uuid, uuid, uuid, integer, text, text) to authenticated;
grant execute on function public.fn_stock_return(uuid, uuid, integer, text, boolean, text) to authenticated;
