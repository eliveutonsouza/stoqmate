-- Fase 5 — compras (reposição real), promoções, clientes com crédito.

-- ============================================================
-- Compras
-- ============================================================
create type public.purchase_order_status as enum ('sent', 'received');

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid not null references public.stores(id),
  supplier_id uuid not null references public.suppliers(id),
  status public.purchase_order_status not null default 'sent',
  notes text,
  freight numeric(12, 2) not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  received_at timestamptz
);
create index purchase_orders_tenant_id_idx on public.purchase_orders (tenant_id);
create index purchase_orders_store_id_idx on public.purchase_orders (store_id);

create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  qty_ordered integer not null,
  qty_received integer not null default 0,
  unit_cost numeric(12, 2) not null
);
create index purchase_order_items_order_id_idx on public.purchase_order_items (order_id);

-- Lê venda dos últimos 30 dias por RLS normal (security invoker) — nunca
-- vaza dado de outro tenant mesmo que p_store_id venha errado, porque as
-- tabelas de origem (products/stock_balances/sales) já filtram por RLS.
create function public.fn_replenishment_suggestions(p_store_id uuid)
returns table (
  product_id uuid, sku text, name text, brand text, attrs jsonb, category jsonb,
  stock integer, min_stock integer, sold_30d integer, cover_days numeric,
  supplier_id uuid, supplier_name text, lead_time_days integer, cost_price numeric, suggest_qty integer
)
language sql
stable
set search_path = public
as $$
  select
    p.id, p.sku, p.name, p.brand, p.attrs,
    (to_jsonb(c) - 'tenant_id') as category,
    coalesce(sb.qty, 0) as stock,
    p.min_stock,
    coalesce(sold.qty, 0)::integer as sold_30d,
    case when coalesce(sold.qty, 0) = 0 then null else round(coalesce(sb.qty, 0) / (sold.qty::numeric / 30), 1) end as cover_days,
    s.id as supplier_id, s.name as supplier_name, coalesce(s.lead_time_days, 0)::integer as lead_time_days, p.cost_price,
    greatest(0, ceil(
      (coalesce(sold.qty, 0)::numeric / 30) * (coalesce(s.lead_time_days, 0) + 30) - coalesce(sb.qty, 0)
    ))::integer as suggest_qty
  from public.products p
  left join public.categories c on c.id = p.category_id
  left join public.suppliers s on s.id = p.supplier_id
  left join public.stock_balances sb on sb.product_id = p.id and sb.store_id = p_store_id
  left join (
    select si.product_id, sum(si.qty) as qty
    from public.sale_items si
    join public.sales sa on sa.id = si.sale_id
    where sa.store_id = p_store_id and sa.created_at >= now() - interval '30 days'
    group by si.product_id
  ) sold on sold.product_id = p.id
  where p.active
  order by suggest_qty desc, p.name;
$$;
grant execute on function public.fn_replenishment_suggestions(uuid) to authenticated;

create function public.fn_purchase_order_create(
  p_store_id uuid, p_supplier_id uuid, p_items jsonb, p_notes text default null, p_freight numeric default 0
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_order_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_qty integer;
  v_cost numeric;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('purchasing', 2) then
    raise exception 'not authorized';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'informe ao menos um item';
  end if;
  if not exists (select 1 from public.stores where id = p_store_id and tenant_id = v_tenant_id) then
    raise exception 'loja inválida';
  end if;
  if not exists (select 1 from public.suppliers where id = p_supplier_id and tenant_id = v_tenant_id) then
    raise exception 'fornecedor inválido';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) elem
    where not exists (select 1 from public.products where id = (elem ->> 'product_id')::uuid and tenant_id = v_tenant_id)
  ) then
    raise exception 'produto inválido';
  end if;

  insert into public.purchase_orders (tenant_id, store_id, supplier_id, notes, freight, created_by)
  values (v_tenant_id, p_store_id, p_supplier_id, p_notes, p_freight, auth.uid())
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'qty')::integer;
    if v_qty <= 0 then
      raise exception 'quantidade precisa ser positiva';
    end if;
    select cost_price into v_cost from public.products where id = v_product_id;
    insert into public.purchase_order_items (order_id, product_id, qty_ordered, unit_cost)
    values (v_order_id, v_product_id, v_qty, v_cost);
  end loop;

  return v_order_id;
end;
$$;
grant execute on function public.fn_purchase_order_create(uuid, uuid, jsonb, text, numeric) to authenticated;

-- Recebimento simplificado: 1 evento fecha o pedido (mesma decisão de
-- fn_stock_count_submit) — cada item recebido vira entrada de estoque real.
create function public.fn_purchase_order_receive(p_order_id uuid, p_items jsonb)
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

    select product_id into v_product_id from public.purchase_order_items where id = v_order_item_id and order_id = p_order_id;
    if not found then
      raise exception 'item de pedido inválido';
    end if;

    update public.purchase_order_items set qty_received = v_qty_received where id = v_order_item_id;

    if v_qty_received > 0 then
      select coalesce((select qty from public.stock_balances where product_id = v_product_id and store_id = v_order.store_id), 0) into v_before;
      v_after := v_before + v_qty_received;

      insert into public.stock_balances (product_id, store_id, qty)
      values (v_product_id, v_order.store_id, v_after)
      on conflict (product_id, store_id) do update set qty = v_after, updated_at = now();

      insert into public.stock_movements (tenant_id, store_id, product_id, kind, qty, before_qty, after_qty, reference_type, reference_id, created_by)
      values (v_tenant_id, v_order.store_id, v_product_id, 'entry', v_qty_received, v_before, v_after, 'purchase_order', p_order_id, auth.uid());
    end if;
  end loop;

  update public.purchase_orders set status = 'received', received_at = now() where id = p_order_id;
end;
$$;
grant execute on function public.fn_purchase_order_receive(uuid, jsonb) to authenticated;

alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;

create policy purchase_orders_select on public.purchase_orders
  for select to authenticated using (tenant_id = public.auth_tenant_id() and public.has_access('purchasing', 1));
create policy purchase_order_items_select on public.purchase_order_items
  for select to authenticated
  using (exists (select 1 from public.purchase_orders po where po.id = order_id and po.tenant_id = public.auth_tenant_id() and public.has_access('purchasing', 1)));

grant select on public.purchase_orders, public.purchase_order_items to authenticated;

-- ============================================================
-- Promoções
-- ============================================================
create type public.promotion_scope as enum ('product', 'category', 'store');

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  scope_type public.promotion_scope not null,
  product_id uuid references public.products(id),
  category_id uuid references public.categories(id),
  promo_price numeric(12, 2) not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  until_stock boolean not null default false,
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint promotions_scope_ref_chk check (
    (scope_type = 'product' and product_id is not null and category_id is null)
    or (scope_type = 'category' and category_id is not null and product_id is null)
    or (scope_type = 'store' and product_id is null and category_id is null)
  )
);
create index promotions_tenant_id_idx on public.promotions (tenant_id);

create function public.fn_promotion_create(
  p_name text, p_scope_type text, p_product_id uuid, p_category_id uuid, p_promo_price numeric,
  p_starts_at timestamptz, p_ends_at timestamptz default null, p_until_stock boolean default false
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_promotion_id uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('promos', 2) then
    raise exception 'not authorized';
  end if;
  if length(coalesce(p_name, '')) = 0 then
    raise exception 'informe um nome para a promoção';
  end if;
  if p_promo_price <= 0 then
    raise exception 'preço promocional precisa ser positivo';
  end if;
  if p_scope_type = 'product' then
    if not exists (select 1 from public.products where id = p_product_id and tenant_id = v_tenant_id) then
      raise exception 'produto inválido';
    end if;
    if p_promo_price >= (select sale_price from public.products where id = p_product_id) then
      raise exception 'preço promocional precisa ser menor que o preço original';
    end if;
  elsif p_scope_type = 'category' then
    if not exists (select 1 from public.categories where id = p_category_id and tenant_id = v_tenant_id) then
      raise exception 'categoria inválida';
    end if;
  elsif p_scope_type <> 'store' then
    raise exception 'abrangência inválida';
  end if;

  insert into public.promotions (tenant_id, name, scope_type, product_id, category_id, promo_price, starts_at, ends_at, until_stock, created_by)
  values (
    v_tenant_id, p_name, p_scope_type::public.promotion_scope,
    case when p_scope_type = 'product' then p_product_id end,
    case when p_scope_type = 'category' then p_category_id end,
    p_promo_price, p_starts_at, p_ends_at, p_until_stock, auth.uid()
  )
  returning id into v_promotion_id;

  return v_promotion_id;
end;
$$;
grant execute on function public.fn_promotion_create(text, text, uuid, uuid, numeric, timestamptz, timestamptz, boolean) to authenticated;

create function public.fn_promotion_set_active(p_id uuid, p_active boolean)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('promos', 2) then
    raise exception 'not authorized';
  end if;
  update public.promotions set active = p_active where id = p_id and tenant_id = v_tenant_id;
  if not found then
    raise exception 'promoção não encontrada';
  end if;
end;
$$;
grant execute on function public.fn_promotion_set_active(uuid, boolean) to authenticated;

alter table public.promotions enable row level security;
create policy promotions_select on public.promotions
  for select to authenticated using (tenant_id = public.auth_tenant_id() and public.has_access('promos', 1));
grant select on public.promotions to authenticated;

-- ============================================================
-- Clientes: crédito
-- ============================================================
alter table public.customers
  add column phone text,
  add column email text,
  add column notes text,
  add column credit_limit numeric(12, 2) not null default 0,
  add column credit_balance numeric(12, 2) not null default 0;

create table public.customer_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  delta numeric(12, 2) not null,
  balance_after numeric(12, 2) not null,
  reason text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index customer_credit_ledger_customer_id_idx on public.customer_credit_ledger (customer_id);

create function public.fn_customer_create(
  p_name text, p_doc text default null, p_phone text default null, p_email text default null, p_notes text default null
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_customer_id uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('pos', 2) then
    raise exception 'not authorized';
  end if;
  if length(coalesce(p_name, '')) = 0 then
    raise exception 'informe o nome do cliente';
  end if;

  insert into public.customers (tenant_id, name, doc, phone, email, notes)
  values (v_tenant_id, p_name, p_doc, p_phone, p_email, p_notes)
  returning id into v_customer_id;

  return v_customer_id;
end;
$$;
grant execute on function public.fn_customer_create(text, text, text, text, text) to authenticated;

create function public.fn_customer_credit_adjust(p_customer_id uuid, p_delta numeric, p_reason text)
returns numeric
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_before numeric;
  v_after numeric;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('pos', 2) then
    raise exception 'not authorized';
  end if;
  if length(coalesce(p_reason, '')) = 0 then
    raise exception 'informe o motivo do ajuste';
  end if;

  select credit_balance into v_before from public.customers where id = p_customer_id and tenant_id = v_tenant_id;
  if not found then
    raise exception 'cliente não encontrado';
  end if;
  v_after := v_before + p_delta;

  update public.customers set credit_balance = v_after where id = p_customer_id;

  insert into public.customer_credit_ledger (tenant_id, customer_id, delta, balance_after, reason, created_by)
  values (v_tenant_id, p_customer_id, p_delta, v_after, p_reason, auth.uid());

  return v_after;
end;
$$;
grant execute on function public.fn_customer_credit_adjust(uuid, numeric, text) to authenticated;

alter table public.customer_credit_ledger enable row level security;
create policy customer_credit_ledger_select on public.customer_credit_ledger
  for select to authenticated
  using (tenant_id = public.auth_tenant_id() and public.has_access('pos', 1));
grant select on public.customer_credit_ledger to authenticated;
