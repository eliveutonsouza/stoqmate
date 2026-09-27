-- Pagamento como REGISTRO. O Stoqmate não processa dinheiro: maquininha e
-- PIX são da loja. Até aqui a venda guardava só um rótulo
-- (sales.payment_method); "dividido" não guardava quanto foi em cada forma,
-- crédito em loja não pagava nada e troca/devolução não registravam o
-- acerto. A partir daqui, todo dinheiro que entra ou sai por causa de um
-- documento (venda, troca, devolução) vira linha em `payments`.
--
-- `provider`, `external_ref` e `status` ficam vazios/`recorded` por
-- enquanto: são o encaixe de uma integração futura com o provedor da
-- própria loja (link de PIX, maquininha), sem migrar tabela.

-- 1. Tabela ------------------------------------------------------------------

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  document_type text not null check (document_type in ('sale', 'exchange', 'return')),
  document_id uuid not null,
  direction text not null check (direction in ('in', 'out')),
  method public.payment_method not null,
  amount numeric(12, 2) not null check (amount > 0),
  installments smallint not null default 1 check (installments between 1 and 24),
  cash_session_id uuid references public.cash_sessions(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  provider text,
  external_ref text,
  status text not null default 'recorded' check (status in ('recorded', 'pending', 'confirmed', 'failed')),
  created_by uuid,
  created_at timestamptz not null default now()
);

create index payments_document_idx on public.payments (document_type, document_id);
create index payments_tenant_created_idx on public.payments (tenant_id, created_at);

alter table public.payments enable row level security;
create policy payments_select on public.payments
  for select to authenticated
  using (tenant_id = public.auth_tenant_id() and (public.has_access('pos', 1) or public.has_access('stock', 1)));
revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;

-- Histórico: cada venda que já existe vira uma linha com o método e o total.
insert into public.payments (tenant_id, store_id, document_type, document_id, direction, method, amount, installments, customer_id, created_by, created_at)
select s.tenant_id, s.store_id, 'sale', s.id, 'in', s.payment_method, s.total, greatest(coalesce(s.installments, 1), 1), s.customer_id, s.created_by, s.created_at
from public.sales s
where s.total > 0;

-- 2. Controle de caixa opcional e ferramentas por plano -----------------------

alter table public.tenants add column if not exists cash_control boolean not null default true;

create or replace function public.fn_set_cash_control(p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('company', 2) then
    raise exception 'not authorized';
  end if;
  if p_enabled is null then
    raise exception 'informe se o controle de caixa fica ligado';
  end if;
  if not p_enabled and exists (select 1 from public.cash_sessions where tenant_id = v_tenant_id and status = 'open') then
    raise exception 'feche os caixas abertos antes de desligar o controle de caixa';
  end if;
  update public.tenants set cash_control = p_enabled where id = v_tenant_id;
  perform public.fn_write_audit('settings', case when p_enabled then 'Ligou o controle de caixa' else 'Desligou o controle de caixa' end, 'tenant', v_tenant_id);
end;
$$;
revoke execute on function public.fn_set_cash_control(boolean) from public, anon;
grant execute on function public.fn_set_cash_control(boolean) to authenticated;

-- Ferramentas futuras (integração de pagamento, contas a receber...) ligam
-- por plano aqui, sem nova coluna: plans.features = {"receivables": true}.
alter table public.plans add column if not exists features jsonb not null default '{}'::jsonb;

create or replace function public.fn_tenant_has_feature(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((pl.features ->> p_key)::boolean, false)
  from public.tenants t join public.plans pl on pl.id = t.plan_id
  where t.id = public.auth_tenant_id();
$$;
revoke execute on function public.fn_tenant_has_feature(text) from public, anon;
grant execute on function public.fn_tenant_has_feature(text) to authenticated;

-- 3. Crédito do cliente: um único caminho de escrita ---------------------------

-- Interno (não exposto): trava o saldo, recusa ficar negativo, grava o
-- ledger. Usado pelo ajuste manual e pelos pagamentos com crédito da loja.
create or replace function public.fn_customer_credit_apply(p_tenant_id uuid, p_customer_id uuid, p_delta numeric, p_reason text)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before numeric;
  v_after numeric;
begin
  select credit_balance into v_before from public.customers
    where id = p_customer_id and tenant_id = p_tenant_id for update;
  if not found then
    raise exception 'cliente não encontrado';
  end if;
  v_after := v_before + p_delta;
  if v_after < 0 then
    raise exception 'crédito insuficiente — saldo do cliente é R$ %', replace(to_char(v_before, 'FM999999990.00'), '.', ',');
  end if;
  update public.customers set credit_balance = v_after where id = p_customer_id;
  insert into public.customer_credit_ledger (tenant_id, customer_id, delta, balance_after, reason, created_by)
  values (p_tenant_id, p_customer_id, p_delta, v_after, p_reason, auth.uid());
  return v_after;
end;
$$;
revoke execute on function public.fn_customer_credit_apply(uuid, uuid, numeric, text) from public, anon, authenticated;

create or replace function public.fn_customer_credit_adjust(p_customer_id uuid, p_delta numeric, p_reason text)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('pos', 2) then
    raise exception 'not authorized';
  end if;
  if length(coalesce(p_reason, '')) = 0 then
    raise exception 'informe o motivo do ajuste';
  end if;
  if p_delta is null or p_delta = 0 or abs(p_delta) > 100000 then
    raise exception 'valor de ajuste inválido';
  end if;
  return public.fn_customer_credit_apply(v_tenant_id, p_customer_id, p_delta, p_reason);
end;
$$;

-- 4. Registro de pagamentos (interno) ----------------------------------------

-- Valida e grava as formas de pagamento de um documento. Efeitos:
--   dinheiro      → movimento no caixa aberto da loja (obrigatório quando a
--                   rede controla caixa); entrada = 'sale', saída = 'refund'
--   credito_loja  → débito (entrada) ou crédito (saída) no saldo do cliente
-- Devolve o método-resumo pra sales.payment_method ('dividido' se houver
-- mais de uma forma).
create or replace function public.fn_register_payments(
  p_tenant_id uuid, p_store_id uuid, p_document_type text, p_document_id uuid,
  p_direction text, p_customer_id uuid, p_payments jsonb, p_expected numeric, p_note text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry jsonb;
  v_method text;
  v_amount numeric;
  v_installments integer;
  v_sum numeric := 0;
  v_count integer := 0;
  v_cash_control boolean;
  v_session_id uuid;
  v_allowed text[];
  v_summary text;
begin
  if p_payments is null or jsonb_typeof(p_payments) <> 'array' then
    p_payments := '[]'::jsonb;
  end if;
  if jsonb_array_length(p_payments) > 6 then
    raise exception 'no máximo 6 formas de pagamento por documento';
  end if;

  v_allowed := case when p_direction = 'in'
    then array['dinheiro', 'pix', 'debito', 'credito', 'credito_loja', 'outro']
    else array['dinheiro', 'pix', 'credito_loja', 'outro'] end;

  for v_entry in select * from jsonb_array_elements(p_payments)
  loop
    v_method := v_entry ->> 'method';
    v_amount := round(coalesce((v_entry ->> 'amount')::numeric, 0), 2);
    v_installments := coalesce((v_entry ->> 'installments')::integer, 1);
    if v_method is null or not (v_method = any (v_allowed)) then
      raise exception 'forma de pagamento inválida: %', coalesce(v_method, '(vazia)');
    end if;
    if v_amount <= 0 then
      raise exception 'valor de pagamento precisa ser positivo';
    end if;
    if v_installments < 1 or v_installments > 12 or (v_installments > 1 and v_method <> 'credito') then
      raise exception 'parcelas só no crédito, de 1 a 12';
    end if;
    v_sum := v_sum + v_amount;
    v_count := v_count + 1;
  end loop;

  if abs(v_sum - round(p_expected, 2)) > 0.01 then
    raise exception 'as formas de pagamento somam R$ %, mas o valor é R$ %',
      replace(to_char(v_sum, 'FM999999990.00'), '.', ','), replace(to_char(p_expected, 'FM999999990.00'), '.', ',');
  end if;

  select cash_control into v_cash_control from public.tenants where id = p_tenant_id;

  for v_entry in select * from jsonb_array_elements(p_payments)
  loop
    v_method := v_entry ->> 'method';
    v_amount := round((v_entry ->> 'amount')::numeric, 2);
    v_installments := coalesce((v_entry ->> 'installments')::integer, 1);
    v_session_id := null;

    if v_method = 'credito_loja' then
      if p_customer_id is null then
        raise exception 'crédito da loja exige o cliente na venda';
      end if;
      perform public.fn_customer_credit_apply(
        p_tenant_id, p_customer_id,
        case when p_direction = 'in' then -v_amount else v_amount end,
        coalesce(p_note, 'Pagamento') || case when p_direction = 'in' then ' (uso do crédito)' else ' (crédito gerado)' end
      );
    end if;

    if v_method = 'dinheiro' and v_cash_control then
      select id into v_session_id from public.cash_sessions
        where tenant_id = p_tenant_id and store_id = p_store_id and status = 'open'
        for update;
      if v_session_id is null then
        raise exception 'abra o caixa desta loja para movimentar dinheiro';
      end if;
      insert into public.cash_session_movements (session_id, kind, amount, note, reference_id, created_by)
      values (
        v_session_id,
        case when p_direction = 'in' then 'sale' else 'refund' end::public.cash_movement_kind,
        case when p_direction = 'in' then v_amount else -v_amount end,
        coalesce(p_note, 'Pagamento em dinheiro'), p_document_id, auth.uid()
      );
    end if;

    insert into public.payments (tenant_id, store_id, document_type, document_id, direction, method, amount, installments, cash_session_id, customer_id, created_by)
    values (p_tenant_id, p_store_id, p_document_type, p_document_id, p_direction, v_method::public.payment_method, v_amount, v_installments, v_session_id, p_customer_id, auth.uid());

    v_summary := v_method;
  end loop;

  return case when v_count = 0 then 'outro' when v_count > 1 then 'dividido' else v_summary end;
end;
$$;
revoke execute on function public.fn_register_payments(uuid, uuid, text, uuid, text, uuid, jsonb, numeric, text) from public, anon, authenticated;

-- 5. Venda com várias formas -------------------------------------------------

-- Assinatura nova (p_payments jsonb). A versão antiga (p_payment_method
-- text, 9 argumentos) continua viva até o deploy do app novo e sai numa
-- migration seguinte.
create or replace function public.fn_confirm_sale(
  p_store_id uuid, p_customer_id uuid, p_payments jsonb, p_notes text, p_items jsonb,
  p_order_discount_amount numeric default 0, p_discount_approval_id uuid default null
)
returns uuid
language plpgsql
security definer
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
  v_total_off_pct numeric;
  v_approval public.discount_approvals%rowtype;
  v_before integer;
  v_after integer;
  v_summary text;
  v_installments integer;
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
  v_total := round(v_subtotal
    - (select coalesce(sum((elem ->> 'qty')::integer * (elem ->> 'unit_price')::numeric * coalesce((elem ->> 'discount_pct')::numeric, 0) / 100), 0)
       from jsonb_array_elements(p_items) elem)
    - coalesce(p_order_discount_amount, 0), 2);
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

  v_installments := coalesce((
    select max((e ->> 'installments')::integer) from jsonb_array_elements(coalesce(p_payments, '[]'::jsonb)) e
    where e ->> 'method' = 'credito'
  ), 1);

  insert into public.sales (tenant_id, store_id, customer_id, salesperson_id, subtotal, discount_amount, total, payment_method, installments, notes, created_by)
  values (v_tenant_id, p_store_id, p_customer_id, auth.uid(), v_subtotal,
    (v_subtotal - v_total), v_total, 'outro', v_installments, p_notes, auth.uid())
  returning id into v_sale_id;

  v_summary := public.fn_register_payments(v_tenant_id, p_store_id, 'sale', v_sale_id, 'in', p_customer_id, p_payments, v_total, 'Venda');
  update public.sales set payment_method = v_summary::public.payment_method where id = v_sale_id;

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

  return v_sale_id;
end;
$$;
revoke execute on function public.fn_confirm_sale(uuid, uuid, jsonb, text, jsonb, numeric, uuid) from public, anon;
grant execute on function public.fn_confirm_sale(uuid, uuid, jsonb, text, jsonb, numeric, uuid) to authenticated;

-- 6. Devolução e troca com acerto --------------------------------------------

-- Parâmetros novos no fim, com default: a chamada antiga (sem acerto)
-- continua valendo e cai na mesma função.
drop function if exists public.fn_stock_return(uuid, uuid, integer, text, boolean, text);
create or replace function public.fn_stock_return(
  p_store_id uuid, p_product_id uuid, p_qty integer, p_reason text, p_restock boolean,
  p_notes text default null, p_customer_id uuid default null, p_payments jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_before integer;
  v_after integer;
  v_movement_id uuid;
  v_refund numeric;
  v_cap numeric;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('stock', 2) then
    raise exception 'not authorized';
  end if;
  if p_qty is null or p_qty <= 0 then
    raise exception 'quantidade precisa ser positiva';
  end if;
  if not exists (select 1 from public.stores where id = p_store_id and tenant_id = v_tenant_id) then
    raise exception 'loja inválida';
  end if;
  if not exists (select 1 from public.products where id = p_product_id and tenant_id = v_tenant_id) then
    raise exception 'produto inválido';
  end if;
  if p_customer_id is not null and not exists (select 1 from public.customers where id = p_customer_id and tenant_id = v_tenant_id) then
    raise exception 'cliente inválido';
  end if;

  insert into public.stock_balances (product_id, store_id, qty)
  values (p_product_id, p_store_id, 0)
  on conflict (product_id, store_id) do nothing;
  select qty into v_before from public.stock_balances
    where product_id = p_product_id and store_id = p_store_id for update;

  if p_restock then
    v_after := v_before + p_qty;
    update public.stock_balances set qty = v_after, updated_at = now()
      where product_id = p_product_id and store_id = p_store_id;
  else
    v_after := v_before;
  end if;

  insert into public.stock_movements (tenant_id, store_id, product_id, kind, qty, before_qty, after_qty, reference_type, reason, justification, created_by)
  values (v_tenant_id, p_store_id, p_product_id, 'return', case when p_restock then p_qty else 0 end, v_before, v_after,
    case when p_restock then 'restock' else 'avaria' end, p_reason, p_notes, auth.uid())
  returning id into v_movement_id;

  -- Estorno opcional: até o preço de tabela das unidades devolvidas.
  if p_payments is not null and jsonb_typeof(p_payments) = 'array' and jsonb_array_length(p_payments) > 0 then
    select coalesce(sum(round((e ->> 'amount')::numeric, 2)), 0) into v_refund from jsonb_array_elements(p_payments) e;
    select p_qty * sale_price into v_cap from public.products where id = p_product_id;
    if v_refund > v_cap + 0.01 then
      raise exception 'estorno maior que o valor dos itens devolvidos (R$ %)', replace(to_char(v_cap, 'FM999999990.00'), '.', ',');
    end if;
    perform public.fn_register_payments(v_tenant_id, p_store_id, 'return', v_movement_id, 'out', p_customer_id, p_payments, v_refund, 'Devolução');
  end if;

  return v_movement_id;
end;
$$;
revoke execute on function public.fn_stock_return(uuid, uuid, integer, text, boolean, text, uuid, jsonb) from public, anon;
grant execute on function public.fn_stock_return(uuid, uuid, integer, text, boolean, text, uuid, jsonb) to authenticated;

drop function if exists public.fn_stock_exchange(uuid, uuid, uuid, integer, text, text);
create or replace function public.fn_stock_exchange(
  p_store_id uuid, p_returned_product_id uuid, p_delivered_product_id uuid, p_qty integer, p_reason text,
  p_notes text default null, p_customer_id uuid default null, p_payments jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_exchange_id uuid;
  v_before integer;
  v_after integer;
  v_diff numeric;
  v_given numeric;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('stock', 2) then
    raise exception 'not authorized';
  end if;
  if p_qty is null or p_qty <= 0 then
    raise exception 'quantidade precisa ser positiva';
  end if;
  if p_returned_product_id = p_delivered_product_id then
    raise exception 'itens devolvido e entregue precisam ser diferentes';
  end if;
  if not exists (select 1 from public.stores where id = p_store_id and tenant_id = v_tenant_id) then
    raise exception 'loja inválida';
  end if;
  if (select count(*) from public.products
        where id in (p_returned_product_id, p_delivered_product_id) and tenant_id = v_tenant_id) <> 2 then
    raise exception 'produto inválido';
  end if;
  if p_customer_id is not null and not exists (select 1 from public.customers where id = p_customer_id and tenant_id = v_tenant_id) then
    raise exception 'cliente inválido';
  end if;

  v_exchange_id := gen_random_uuid();

  insert into public.stock_balances (product_id, store_id, qty)
  values (p_returned_product_id, p_store_id, 0), (p_delivered_product_id, p_store_id, 0)
  on conflict (product_id, store_id) do nothing;

  select qty into v_before from public.stock_balances
    where product_id = p_returned_product_id and store_id = p_store_id for update;
  v_after := v_before + p_qty;
  update public.stock_balances set qty = v_after, updated_at = now()
    where product_id = p_returned_product_id and store_id = p_store_id;
  insert into public.stock_movements (tenant_id, store_id, product_id, kind, qty, before_qty, after_qty, reference_type, reference_id, reason, justification, created_by)
  values (v_tenant_id, p_store_id, p_returned_product_id, 'exchange', p_qty, v_before, v_after, 'exchange', v_exchange_id, p_reason, p_notes, auth.uid());

  select qty into v_before from public.stock_balances
    where product_id = p_delivered_product_id and store_id = p_store_id for update;
  if v_before < p_qty then
    raise exception 'saldo insuficiente do item entregue';
  end if;
  v_after := v_before - p_qty;
  update public.stock_balances set qty = v_after, updated_at = now()
    where product_id = p_delivered_product_id and store_id = p_store_id;
  insert into public.stock_movements (tenant_id, store_id, product_id, kind, qty, before_qty, after_qty, reference_type, reference_id, reason, justification, created_by)
  values (v_tenant_id, p_store_id, p_delivered_product_id, 'exchange', -p_qty, v_before, v_after, 'exchange', v_exchange_id, p_reason, p_notes, auth.uid());

  -- Diferença calculada aqui, com o preço vigente (promoção inclusa):
  -- positiva = cliente paga; negativa = loja devolve (ou não, se a política
  -- da loja for só trocar — aí o acerto fica vazio).
  select round(p_qty * ((select price from public.fn_effective_price(p_delivered_product_id))
                      - (select price from public.fn_effective_price(p_returned_product_id))), 2)
    into v_diff;
  select coalesce(sum(round((e ->> 'amount')::numeric, 2)), 0) into v_given
    from jsonb_array_elements(case when jsonb_typeof(p_payments) = 'array' then p_payments else '[]'::jsonb end) e;

  if v_diff > 0.009 then
    perform public.fn_register_payments(v_tenant_id, p_store_id, 'exchange', v_exchange_id, 'in', p_customer_id, p_payments, v_diff, 'Troca');
  elsif v_diff < -0.009 and v_given > 0 then
    if v_given > abs(v_diff) + 0.01 then
      raise exception 'devolução maior que a diferença da troca (R$ %)', replace(to_char(abs(v_diff), 'FM999999990.00'), '.', ',');
    end if;
    perform public.fn_register_payments(v_tenant_id, p_store_id, 'exchange', v_exchange_id, 'out', p_customer_id, p_payments, v_given, 'Troca');
  elsif v_given > 0 then
    raise exception 'troca sem diferença de valor não tem acerto';
  end if;

  return v_exchange_id;
end;
$$;
revoke execute on function public.fn_stock_exchange(uuid, uuid, uuid, integer, text, text, uuid, jsonb) from public, anon;
grant execute on function public.fn_stock_exchange(uuid, uuid, uuid, integer, text, text, uuid, jsonb) to authenticated;

-- 7. Caixa: diferença no fechamento vira aviso ---------------------------------

create or replace function public.fn_cash_session_close(p_session_id uuid, p_counted_amount numeric, p_discrepancy_reason text default null, p_discrepancy_detail text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_store_id uuid;
  v_expected numeric;
  v_diff numeric;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('pos', 2) then
    raise exception 'not authorized';
  end if;
  select store_id into v_store_id from public.cash_sessions
    where id = p_session_id and tenant_id = v_tenant_id and status = 'open' for update;
  if not found then
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

  if abs(v_diff) > 0.01 then
    insert into public.notifications (tenant_id, store_id, kind, title, message, target_type, target_id)
    values (
      v_tenant_id, v_store_id, 'cash_discrepancy', 'Diferença no caixa',
      format('Caixa de %s fechou com %s de R$ %s (esperado R$ %s, contado R$ %s). Motivo: %s — %s',
        coalesce((select name from public.stores where id = v_store_id), 'loja'),
        case when v_diff > 0 then 'sobra' else 'falta' end,
        replace(to_char(abs(v_diff), 'FM999999990.00'), '.', ','), replace(to_char(v_expected, 'FM999999990.00'), '.', ','), replace(to_char(p_counted_amount, 'FM999999990.00'), '.', ','),
        coalesce(p_discrepancy_reason, 'não informado'), p_discrepancy_detail),
      'cash_session', p_session_id
    );
  end if;
end;
$$;

-- Fila de email: diferença de caixa tem regra própria.
create or replace function public.fn_claim_notification_emails(p_limit integer default 20)
returns table (id uuid, kind text, title text, message text, created_at timestamptz, recipients text[])
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_tenant_id uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null then
    raise exception 'not authorized';
  end if;

  return query
  with pending as (
    select n.id
    from public.notifications n
    join public.notification_preferences np
      on np.tenant_id = n.tenant_id
     and np.email
     and np.rule = case n.kind
       when 'out_of_stock' then 'low_stock'
       when 'low_stock' then 'below_min'
       when 'access_request' then 'access_request'
       when 'cash_discrepancy' then 'cash_discrepancy'
     end
    where n.tenant_id = v_tenant_id
      and n.emailed_at is null
      and n.created_at > now() - interval '24 hours'
    order by n.created_at
    limit least(greatest(coalesce(p_limit, 20), 1), 50)
    for update of n skip locked
  ),
  claimed as (
    update public.notifications n set emailed_at = now()
    from pending where n.id = pending.id
    returning n.id, n.kind, n.title, n.message, n.created_at
  )
  select c.id, c.kind, c.title, c.message, c.created_at,
    coalesce((
      select array_agg(distinct u.email::text)
      from public.store_users su
      join auth.users u on u.id = su.user_id
      where su.tenant_id = v_tenant_id and su.role = 'proprietario' and su.status = 'active' and u.email is not null
    ), '{}')
  from claimed c;
end;
$$;

-- 8. Relatório de vendas: quanto entrou por forma de pagamento -----------------

create or replace function public.fn_sales_report(p_start timestamp with time zone, p_end timestamp with time zone, p_store_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with s as (
    select * from public.sales
    where created_at >= p_start and created_at < p_end and status = 'completed'
      and (p_store_id is null or store_id = p_store_id)
  ),
  si as (
    select sale_items.*, s.created_at, s.store_id
    from public.sale_items
    join s on s.id = sale_items.sale_id
  ),
  si_cost as (
    select si.*, coalesce(public.fn_product_cost(p.id), 0) as unit_cost, p.category_id, p.brand, p.min_stock
    from si join public.products p on p.id = si.product_id
  ),
  totals as (
    select coalesce(sum(total), 0) as revenue, count(*) as sale_count from s
  ),
  agg_units_cost as (
    select coalesce(sum(qty), 0) as units, coalesce(sum(qty * unit_cost), 0) as cost from si_cost
  ),
  daily as (
    select coalesce(jsonb_agg(jsonb_build_object('date', d, 'revenue', revenue) order by d), '[]'::jsonb) as series
    from (select date_trunc('day', created_at at time zone 'America/Sao_Paulo') as d, sum(total) as revenue from s group by 1) x
  ),
  by_store as (
    select coalesce(jsonb_agg(jsonb_build_object('store_id', store_id, 'name', store_name, 'revenue', revenue) order by revenue desc), '[]'::jsonb) as data
    from (
      select s.store_id, st.name as store_name, sum(s.total) as revenue
      from s join public.stores st on st.id = s.store_id
      group by s.store_id, st.name
    ) x
  ),
  by_category as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'category_id', category_id, 'name', name, 'code', code, 'icon', icon, 'color', color,
      'unit', unit, 'unit_plural', unit_plural, 'units', units, 'revenue', revenue, 'cost', case when public.fn_can_see_cost() then cost end
    ) order by revenue desc), '[]'::jsonb) as data
    from (
      select c.id as category_id, c.name, c.code, c.icon, c.color, c.unit, c.unit_plural,
        sum(sc.qty) as units, sum(sc.total) as revenue, sum(sc.qty * sc.unit_cost) as cost
      from si_cost sc join public.categories c on c.id = sc.category_id
      group by c.id, c.name, c.code, c.icon, c.color, c.unit, c.unit_plural
    ) x
  ),
  stock_by_product as (
    select product_id, sum(qty) as stock_qty from public.stock_balances
    where p_store_id is null or store_id = p_store_id
    group by product_id
  ),
  by_product as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'product_id', product_id, 'sku', sku, 'name', name, 'brand', brand,
      'category_id', category_id, 'category_name', category_name,
      'units', units, 'revenue', revenue, 'cost', case when public.fn_can_see_cost() then cost end, 'stock_qty', stock_qty
    ) order by revenue desc), '[]'::jsonb) as data
    from (
      select sc.product_id, p.sku, p.name, sc.brand, sc.category_id, c.name as category_name,
        sum(sc.qty) as units, sum(sc.total) as revenue, sum(sc.qty * sc.unit_cost) as cost,
        coalesce(max(sbp.stock_qty), 0) as stock_qty
      from si_cost sc
      join public.products p on p.id = sc.product_id
      join public.categories c on c.id = sc.category_id
      left join stock_by_product sbp on sbp.product_id = sc.product_id
      group by sc.product_id, p.sku, p.name, sc.brand, sc.category_id, c.name
      order by sum(sc.total) desc
      limit 200
    ) x
  ),
  -- Entradas menos saídas (estornos de devolução/troca) por forma, no período.
  by_payment as (
    select coalesce(jsonb_agg(jsonb_build_object('method', method, 'amount_in', amount_in, 'amount_out', amount_out) order by amount_in desc), '[]'::jsonb) as data
    from (
      select pm.method::text as method,
        sum(case when pm.direction = 'in' then pm.amount else 0 end) as amount_in,
        sum(case when pm.direction = 'out' then pm.amount else 0 end) as amount_out
      from public.payments pm
      where pm.created_at >= p_start and pm.created_at < p_end
        and pm.status in ('recorded', 'confirmed')
        and (p_store_id is null or pm.store_id = p_store_id)
      group by pm.method
    ) x
  )
  select jsonb_build_object(
    'revenue', (select revenue from totals),
    'sale_count', (select sale_count from totals),
    'units', (select units from agg_units_cost),
    'cost', case when public.fn_can_see_cost() then (select cost from agg_units_cost) end,
    'daily_series', (select series from daily),
    'by_store', (select data from by_store),
    'by_category', (select data from by_category),
    'by_product', (select data from by_product),
    'by_payment', (select data from by_payment)
  );
$function$;
