-- Venda passa a respeitar promoções e a exigir aprovação de gestor pra
-- desconto acima de 20%.
--
-- Antes: promoções eram só gravadas (fn_confirm_sale sempre cobrava
-- products.sale_price) e o PDV prometia "acima de 20% exige aprovação do
-- gestor" sem nada no banco que exigisse.
--
-- Preço efetivo = menor promo_price entre as promoções ativas que alcançam
-- o produto (produto, categoria dele ou loja inteira), só se for menor que
-- o preço de tabela. Nunca sobe preço.
--
-- Aprovação: gestor (área 'money' nível 2 — financeiro/proprietário) gera
-- uma autorização de uso único, válida por 10 min, com teto de %. O PDV
-- manda o id junto com a venda; fn_confirm_sale confere e consome. Quem já
-- é gestor vende com qualquer desconto sem autorização extra.

create or replace function public.fn_effective_price(p_product_id uuid)
returns table (price numeric, promotion_id uuid, promotion_name text)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(promo.promo_price, p.sale_price), promo.id, promo.name
  from public.products p
  left join lateral (
    select pr.id, pr.name, pr.promo_price
    from public.promotions pr
    where pr.tenant_id = p.tenant_id
      and pr.active
      and pr.starts_at <= now()
      and (pr.ends_at is null or pr.ends_at > now())
      and pr.promo_price < p.sale_price
      and (
        pr.scope_type = 'store'
        or (pr.scope_type = 'product' and pr.product_id = p.id)
        or (pr.scope_type = 'category' and pr.category_id = p.category_id)
      )
    order by pr.promo_price asc
    limit 1
  ) promo on true
  where p.id = p_product_id and p.tenant_id = public.auth_tenant_id();
$$;
revoke execute on function public.fn_effective_price(uuid) from public, anon;
grant execute on function public.fn_effective_price(uuid) to authenticated;

-- Busca do PDV/movimentações devolve o preço efetivo junto (o carrinho
-- mostra o mesmo valor que o banco vai cobrar).
drop function if exists public.fn_search_products(text, integer);
create function public.fn_search_products(p_term text, p_limit integer default 8)
returns table (
  id uuid, sku text, barcode text, brand text, name text, attrs jsonb,
  sale_price numeric, cost_price numeric, min_stock integer,
  category jsonb, stock_balances jsonb,
  effective_price numeric, promotion_name text
)
language sql
stable
set search_path = public
as $$
  select
    p.id, p.sku, p.barcode, p.brand, p.name, p.attrs, p.sale_price, p.cost_price, p.min_stock,
    (to_jsonb(c) - 'tenant_id') as category,
    coalesce(
      (select jsonb_agg(jsonb_build_object('store_id', sb.store_id, 'qty', sb.qty)) from public.stock_balances sb where sb.product_id = p.id),
      '[]'::jsonb
    ) as stock_balances,
    ep.price as effective_price,
    ep.promotion_name
  from public.products p
  join public.categories c on c.id = p.category_id
  left join lateral public.fn_effective_price(p.id) ep on true
  where p.sku ilike '%' || public.fn_like_escape(p_term) || '%'
     or p.barcode ilike '%' || public.fn_like_escape(p_term) || '%'
     or p.name ilike '%' || public.fn_like_escape(p_term) || '%'
     or p.brand ilike '%' || public.fn_like_escape(p_term) || '%'
  limit least(greatest(coalesce(p_limit, 8), 1), 50);
$$;
revoke execute on function public.fn_search_products(text, integer) from public, anon;
grant execute on function public.fn_search_products(text, integer) to authenticated;

create table if not exists public.discount_approvals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  approved_by uuid not null references auth.users(id),
  max_pct numeric(5, 2) not null check (max_pct > 0 and max_pct <= 100),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '10 minutes',
  used_at timestamptz,
  sale_id uuid references public.sales(id) on delete set null
);
create index if not exists discount_approvals_tenant_idx on public.discount_approvals (tenant_id);
create index if not exists discount_approvals_store_idx on public.discount_approvals (store_id);
create index if not exists discount_approvals_sale_idx on public.discount_approvals (sale_id);
create index if not exists discount_approvals_approved_by_idx on public.discount_approvals (approved_by);

alter table public.discount_approvals enable row level security;
create policy discount_approvals_select on public.discount_approvals
  for select to authenticated
  using (tenant_id = (select public.auth_tenant_id()) and public.has_access('money', 2));
revoke all on public.discount_approvals from anon, authenticated;
grant select on public.discount_approvals to authenticated;

create or replace function public.fn_grant_discount_approval(p_store_id uuid, p_max_pct numeric)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_id uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('money', 2) then
    raise exception 'not authorized';
  end if;
  if not exists (select 1 from public.stores where id = p_store_id and tenant_id = v_tenant_id) then
    raise exception 'loja inválida';
  end if;
  if p_max_pct is null or p_max_pct <= 0 or p_max_pct > 100 then
    raise exception 'percentual de desconto inválido';
  end if;
  insert into public.discount_approvals (tenant_id, store_id, approved_by, max_pct)
  values (v_tenant_id, p_store_id, auth.uid(), round(p_max_pct, 2))
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.fn_grant_discount_approval(uuid, numeric) from public, anon;
grant execute on function public.fn_grant_discount_approval(uuid, numeric) to authenticated;

drop function if exists public.fn_confirm_sale(uuid, uuid, text, integer, uuid, text, jsonb, numeric);

create function public.fn_confirm_sale(
  p_store_id uuid, p_customer_id uuid, p_payment_method text, p_installments integer,
  p_cash_session_id uuid, p_notes text, p_items jsonb, p_order_discount_amount numeric default 0,
  p_discount_approval_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$
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
  v_total_off_pct numeric;
  v_approval public.discount_approvals%rowtype;
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
  -- preço sempre vem do banco (tabela ou promoção ativa), nunca do cliente
  select jsonb_agg(elem || jsonb_build_object('unit_price', ep.price)) into p_items
    from jsonb_array_elements(p_items) elem
    cross join lateral public.fn_effective_price((elem ->> 'product_id')::uuid) ep;

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
    v_subtotal := v_subtotal + (v_qty * v_unit_price);
  end loop;
  v_total := v_subtotal
    - (select coalesce(sum((elem ->> 'qty')::integer * (elem ->> 'unit_price')::numeric * coalesce((elem ->> 'discount_pct')::numeric, 0) / 100), 0)
       from jsonb_array_elements(p_items) elem)
    - coalesce(p_order_discount_amount, 0);
  if v_total < 0 then
    raise exception 'desconto maior que o total';
  end if;

  -- Desconto manual (item + geral) acima de 20% do bruto: gestor vende
  -- direto; demais perfis precisam de autorização válida do gestor.
  v_total_off_pct := case when v_subtotal > 0 then round((v_subtotal - v_total) / v_subtotal * 100, 2) else 0 end;
  if v_total_off_pct > 20 and not public.has_access('money', 2) then
    if p_discount_approval_id is null then
      raise exception 'desconto acima de 20%% exige aprovação do gestor';
    end if;
    select * into v_approval from public.discount_approvals
      where id = p_discount_approval_id and tenant_id = v_tenant_id and store_id = p_store_id
      for update;
    if not found or v_approval.used_at is not null or v_approval.expires_at <= now() then
      raise exception 'aprovação de desconto inválida ou expirada';
    end if;
    if v_approval.max_pct < v_total_off_pct then
      raise exception 'desconto maior que o aprovado pelo gestor';
    end if;
  end if;

  insert into public.sales (tenant_id, store_id, customer_id, salesperson_id, subtotal, discount_amount, total, payment_method, installments, notes, created_by)
  values (v_tenant_id, p_store_id, p_customer_id, auth.uid(), v_subtotal,
    (v_subtotal - v_total), v_total, p_payment_method::public.payment_method, p_installments, p_notes, auth.uid())
  returning id into v_sale_id;

  if v_approval.id is not null then
    update public.discount_approvals set used_at = now(), sale_id = v_sale_id where id = v_approval.id;
  end if;

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
revoke execute on function public.fn_confirm_sale(uuid, uuid, text, integer, uuid, text, jsonb, numeric, uuid) from public, anon;
grant execute on function public.fn_confirm_sale(uuid, uuid, text, integer, uuid, text, jsonb, numeric, uuid) to authenticated;
