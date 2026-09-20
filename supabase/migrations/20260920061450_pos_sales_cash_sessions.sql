-- Fase 4 — POS, vendas e caixa.
--
-- `customers` nasce aqui mínimo (só o que sales precisa referenciar) — a
-- Fase 5 estende com tier/ledger de crédito via ALTER TABLE, aditivo, sem
-- quebrar o que já existe.

create type public.sale_status as enum ('completed', 'voided');
create type public.payment_method as enum ('dinheiro', 'pix', 'debito', 'credito', 'crediario', 'dividido');
create type public.cash_session_status as enum ('open', 'closed');
create type public.cash_movement_kind as enum ('open', 'supply', 'withdraw', 'sale');

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  doc text,
  created_at timestamptz not null default now()
);
create index customers_tenant_id_idx on public.customers (tenant_id);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid not null references public.stores(id),
  customer_id uuid references public.customers(id),
  salesperson_id uuid references auth.users(id),
  status public.sale_status not null default 'completed',
  subtotal numeric(12, 2) not null,
  discount_amount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null,
  payment_method public.payment_method not null,
  installments smallint not null default 1,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index sales_tenant_id_idx on public.sales (tenant_id);
create index sales_store_id_idx on public.sales (store_id);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id),
  sku_snapshot text not null,
  name_snapshot text not null,
  variant_snapshot text,
  qty integer not null,
  unit_price numeric(12, 2) not null,
  discount_pct numeric(5, 2) not null default 0,
  total numeric(12, 2) not null
);
create index sale_items_sale_id_idx on public.sale_items (sale_id);

create table public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid not null references public.stores(id),
  operator_id uuid references auth.users(id),
  status public.cash_session_status not null default 'open',
  opening_amount numeric(12, 2) not null default 0,
  counted_amount numeric(12, 2),
  expected_amount numeric(12, 2),
  diff numeric(12, 2),
  discrepancy_reason text,
  discrepancy_detail text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_by uuid references auth.users(id)
);
create index cash_sessions_tenant_id_idx on public.cash_sessions (tenant_id);
create index cash_sessions_store_id_idx on public.cash_sessions (store_id);

create table public.cash_session_movements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.cash_sessions(id) on delete cascade,
  kind public.cash_movement_kind not null,
  amount numeric(12, 2) not null, -- assinado: supply/sale/open positivos, withdraw negativo
  note text,
  reference_id uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index cash_session_movements_session_id_idx on public.cash_session_movements (session_id);

-- ============================================================
-- fn_cash_session_open / movement / close
-- ============================================================
create function public.fn_cash_session_open(p_store_id uuid, p_opening_amount numeric)
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

create function public.fn_cash_session_movement(p_session_id uuid, p_kind text, p_amount numeric, p_note text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_movement_id uuid;
  v_signed numeric;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('pos', 2) then
    raise exception 'not authorized';
  end if;
  if p_kind not in ('supply', 'withdraw') then
    raise exception 'tipo de movimento inválido';
  end if;
  if p_amount <= 0 then
    raise exception 'valor precisa ser positivo';
  end if;
  if not exists (select 1 from public.cash_sessions where id = p_session_id and tenant_id = v_tenant_id and status = 'open') then
    raise exception 'sessão de caixa não encontrada ou já fechada';
  end if;

  v_signed := case when p_kind = 'withdraw' then -p_amount else p_amount end;

  insert into public.cash_session_movements (session_id, kind, amount, note, created_by)
  values (p_session_id, p_kind::public.cash_movement_kind, v_signed, p_note, auth.uid())
  returning id into v_movement_id;

  return v_movement_id;
end;
$$;

create function public.fn_cash_session_close(
  p_session_id uuid, p_counted_amount numeric, p_discrepancy_reason text default null, p_discrepancy_detail text default null
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_expected numeric;
  v_diff numeric;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('pos', 2) then
    raise exception 'not authorized';
  end if;
  if not exists (select 1 from public.cash_sessions where id = p_session_id and tenant_id = v_tenant_id and status = 'open') then
    raise exception 'sessão de caixa não encontrada ou já fechada';
  end if;

  select coalesce(sum(amount), 0) into v_expected from public.cash_session_movements where session_id = p_session_id;
  v_diff := p_counted_amount - v_expected;

  if abs(v_diff) > 0.01 and length(coalesce(p_discrepancy_detail, '')) < 10 then
    raise exception 'detalhe a divergência do caixa em pelo menos 10 caracteres';
  end if;

  update public.cash_sessions
  set status = 'closed', counted_amount = p_counted_amount, expected_amount = v_expected, diff = v_diff,
      discrepancy_reason = case when abs(v_diff) > 0.01 then p_discrepancy_reason else null end,
      discrepancy_detail = case when abs(v_diff) > 0.01 then p_discrepancy_detail else null end,
      closed_at = now()
  where id = p_session_id;
end;
$$;

-- ============================================================
-- fn_confirm_sale — carrinho inteiro numa transação só.
-- ============================================================
create function public.fn_confirm_sale(
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

-- ============================================================
-- RLS
-- ============================================================
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.cash_sessions enable row level security;
alter table public.cash_session_movements enable row level security;

create policy customers_select on public.customers
  for select to authenticated using (tenant_id = public.auth_tenant_id() and public.has_access('pos', 1));
create policy customers_write on public.customers
  for all to authenticated
  using (tenant_id = public.auth_tenant_id() and public.has_access('pos', 2))
  with check (tenant_id = public.auth_tenant_id() and public.has_access('pos', 2));

create policy sales_select on public.sales
  for select to authenticated using (tenant_id = public.auth_tenant_id() and public.has_access('pos', 1));
create policy sale_items_select on public.sale_items
  for select to authenticated
  using (exists (select 1 from public.sales s where s.id = sale_id and s.tenant_id = public.auth_tenant_id() and public.has_access('pos', 1)));

create policy cash_sessions_select on public.cash_sessions
  for select to authenticated using (tenant_id = public.auth_tenant_id() and public.has_access('pos', 1));
create policy cash_session_movements_select on public.cash_session_movements
  for select to authenticated
  using (exists (select 1 from public.cash_sessions cs where cs.id = session_id and cs.tenant_id = public.auth_tenant_id() and public.has_access('pos', 1)));

grant select, insert, update on public.customers to authenticated;
grant select on public.sales, public.sale_items, public.cash_sessions, public.cash_session_movements to authenticated;
grant execute on function public.fn_cash_session_open(uuid, numeric) to authenticated;
grant execute on function public.fn_cash_session_movement(uuid, text, numeric, text) to authenticated;
grant execute on function public.fn_cash_session_close(uuid, numeric, text, text) to authenticated;
grant execute on function public.fn_confirm_sale(uuid, uuid, text, integer, uuid, text, jsonb, numeric) to authenticated;
