-- Fase 3 — movimentações de estoque, transferências, contagem.
--
-- Todo escritor de saldo passa por uma função security definer (nunca um
-- insert/update solto do cliente em stock_balances) — é o único jeito de
-- garantir before/after consistentes e o movimento sempre gravado junto.
-- Contagem é simplificada pro fluxo de 1 submit só (abre e fecha na mesma
-- chamada): o mock tem "salvar e pausar" como estado intermediário, mas
-- isso é UI, não precisa de uma máquina de estado no banco pra virar real.

create type public.movement_kind as enum ('sale', 'entry', 'return', 'exchange', 'transfer', 'adjustment', 'count');
create type public.transfer_status as enum ('dispatched', 'received', 'discrepancy');

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  kind public.movement_kind not null,
  qty integer not null, -- delta assinado: positivo entra, negativo sai
  unit_cost numeric(12, 2),
  unit_price numeric(12, 2),
  before_qty integer not null,
  after_qty integer not null,
  reference_type text,
  reference_id uuid,
  reason text,
  justification text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index stock_movements_tenant_id_idx on public.stock_movements (tenant_id);
create index stock_movements_product_id_idx on public.stock_movements (product_id);
create index stock_movements_store_id_idx on public.stock_movements (store_id);

create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  origin_store_id uuid not null references public.stores(id),
  destination_store_id uuid not null references public.stores(id),
  status public.transfer_status not null default 'dispatched',
  reason text,
  carrier text,
  notes text,
  responsible_user_id uuid references auth.users(id),
  shipped_at timestamptz not null default now(),
  received_at timestamptz,
  discrepancy_reason text,
  discrepancy_detail text,
  created_by uuid references auth.users(id)
);
create index transfers_tenant_id_idx on public.transfers (tenant_id);

create table public.transfer_items (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid not null references public.transfers(id) on delete cascade,
  product_id uuid not null references public.products(id),
  qty_sent integer not null,
  qty_received integer
);
create index transfer_items_transfer_id_idx on public.transfer_items (transfer_id);

create table public.stock_counts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid not null references public.stores(id),
  location_id uuid references public.locations(id),
  category_id uuid references public.categories(id),
  reason text,
  justification text,
  responsible_user_id uuid references auth.users(id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_by uuid references auth.users(id)
);
create index stock_counts_tenant_id_idx on public.stock_counts (tenant_id);

create table public.stock_count_items (
  id uuid primary key default gen_random_uuid(),
  count_id uuid not null references public.stock_counts(id) on delete cascade,
  product_id uuid not null references public.products(id),
  system_qty integer not null,
  counted_qty integer not null
);
create index stock_count_items_count_id_idx on public.stock_count_items (count_id);

-- ============================================================
-- fn_stock_entry
-- ============================================================
create function public.fn_stock_entry(
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
-- fn_stock_adjustment
-- ============================================================
create function public.fn_stock_adjustment(
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
-- fn_transfer_dispatch / fn_transfer_receive
-- ============================================================
create function public.fn_transfer_dispatch(
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

create function public.fn_transfer_receive(
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
  set status = case when v_has_discrepancy then 'discrepancy' else 'received' end,
      received_at = now(),
      discrepancy_reason = case when v_has_discrepancy then p_discrepancy_reason else null end,
      discrepancy_detail = case when v_has_discrepancy then p_discrepancy_detail else null end
  where id = p_transfer_id;
end;
$$;

-- ============================================================
-- fn_stock_count_submit — abre e fecha a contagem numa chamada só
-- ============================================================
create function public.fn_stock_count_submit(
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
-- RLS
-- ============================================================
alter table public.stock_movements enable row level security;
alter table public.transfers enable row level security;
alter table public.transfer_items enable row level security;
alter table public.stock_counts enable row level security;
alter table public.stock_count_items enable row level security;

create policy stock_movements_select on public.stock_movements
  for select to authenticated using (tenant_id = public.auth_tenant_id() and public.has_access('stock', 1));
-- Sem insert/update/delete direto — só via fn_stock_entry/fn_stock_adjustment/
-- fn_transfer_*/fn_stock_count_submit (security definer).

create policy transfers_select on public.transfers
  for select to authenticated using (tenant_id = public.auth_tenant_id() and public.has_access('stock', 1));

create policy transfer_items_select on public.transfer_items
  for select to authenticated
  using (exists (select 1 from public.transfers t where t.id = transfer_id and t.tenant_id = public.auth_tenant_id() and public.has_access('stock', 1)));

create policy stock_counts_select on public.stock_counts
  for select to authenticated using (tenant_id = public.auth_tenant_id() and public.has_access('stock', 1));

create policy stock_count_items_select on public.stock_count_items
  for select to authenticated
  using (exists (select 1 from public.stock_counts sc where sc.id = count_id and sc.tenant_id = public.auth_tenant_id() and public.has_access('stock', 1)));

grant select on public.stock_movements, public.transfers, public.transfer_items, public.stock_counts, public.stock_count_items to authenticated;
grant execute on function public.fn_stock_entry(uuid, uuid, integer, numeric, text) to authenticated;
grant execute on function public.fn_stock_adjustment(uuid, uuid, integer, text, text) to authenticated;
grant execute on function public.fn_transfer_dispatch(uuid, uuid, jsonb, text, text, text) to authenticated;
grant execute on function public.fn_transfer_receive(uuid, jsonb, text, text) to authenticated;
grant execute on function public.fn_stock_count_submit(uuid, uuid, uuid, jsonb, text, text) to authenticated;
