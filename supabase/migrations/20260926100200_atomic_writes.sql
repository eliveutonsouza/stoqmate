-- Escritas de vários passos viram uma transação só.
--
-- Antes as server actions faziam insert do pai e depois dos filhos em
-- chamadas separadas: falha no meio deixava fornecedor sem categoria,
-- categoria sem atributos, ou entrada de nota com metade dos produtos
-- lançados. Todas as funções abaixo são `security invoker` — RLS e grants
-- das tabelas continuam decidindo quem pode o quê, exatamente como nas
-- chamadas diretas que elas substituem. Ids de categoria chegam como
-- uuid[] (tipado), o que também fecha a montagem de filtro PostgREST com
-- ids crus em syncCategoryLinks.

create or replace function public.fn_create_supplier(p_supplier jsonb, p_category_ids uuid[])
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.suppliers (
    tenant_id, name, cnpj, phone, whatsapp, order_email, sales_rep, address, brands,
    lead_time_days, min_order_value, payment_terms, notes
  )
  values (
    public.auth_tenant_id(),
    p_supplier ->> 'name',
    nullif(p_supplier ->> 'cnpj', ''),
    nullif(p_supplier ->> 'phone', ''),
    nullif(p_supplier ->> 'whatsapp', ''),
    nullif(p_supplier ->> 'order_email', ''),
    nullif(p_supplier ->> 'sales_rep', ''),
    case when nullif(p_supplier ->> 'address', '') is null then null else jsonb_build_object('full', p_supplier ->> 'address') end,
    coalesce((select array_agg(value) from jsonb_array_elements_text(coalesce(p_supplier -> 'brands', '[]'::jsonb))), '{}'),
    (p_supplier ->> 'lead_time_days')::integer,
    (p_supplier ->> 'min_order_value')::numeric,
    nullif(p_supplier ->> 'payment_terms', ''),
    nullif(p_supplier ->> 'notes', '')
  )
  returning id into v_id;

  insert into public.supplier_categories (supplier_id, category_id)
  select v_id, unnest(coalesce(p_category_ids, '{}'));

  return v_id;
end;
$$;

create or replace function public.fn_set_supplier_categories(p_supplier_id uuid, p_category_ids uuid[])
returns void
language plpgsql
set search_path = public
as $$
begin
  insert into public.supplier_categories (supplier_id, category_id)
  select p_supplier_id, unnest(coalesce(p_category_ids, '{}'))
  on conflict do nothing;
  delete from public.supplier_categories
  where supplier_id = p_supplier_id and not (category_id = any(coalesce(p_category_ids, '{}')));
end;
$$;

create or replace function public.fn_set_location_categories(p_location_id uuid, p_category_ids uuid[])
returns void
language plpgsql
set search_path = public
as $$
begin
  insert into public.location_categories (location_id, category_id)
  select p_location_id, unnest(coalesce(p_category_ids, '{}'))
  on conflict do nothing;
  delete from public.location_categories
  where location_id = p_location_id and not (category_id = any(coalesce(p_category_ids, '{}')));
end;
$$;

create or replace function public.fn_create_category(p_category jsonb, p_attributes jsonb)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.categories (tenant_id, name, code, unit, unit_plural, icon, color)
  values (
    public.auth_tenant_id(),
    p_category ->> 'name',
    upper(p_category ->> 'code'),
    p_category ->> 'unit',
    p_category ->> 'unit',
    coalesce(nullif(p_category ->> 'icon', ''), 'Box'),
    coalesce(nullif(p_category ->> 'color', ''), '#6B7280')
  )
  returning id into v_id;

  insert into public.category_attributes (category_id, key, label, type, values, position)
  select v_id, a ->> 'key', a ->> 'label', (a ->> 'type')::public.category_attribute_type,
    coalesce((select array_agg(value) from jsonb_array_elements_text(coalesce(a -> 'values', '[]'::jsonb))), '{}'),
    (ord - 1)::integer
  from jsonb_array_elements(coalesce(p_attributes, '[]'::jsonb)) with ordinality as t(a, ord);

  return v_id;
end;
$$;

-- Entrada por leitura de nota (IA): cadastra os produtos novos e lança a
-- entrada de todos os itens, tudo ou nada. Produto novo nasce com preço de
-- venda = custo (a nota só traz custo) até o lojista ajustar.
-- p_items: [{match:'existing'|'new', sku, product_name, category_id, attributes, qty, unit_cost}]
create or replace function public.fn_confirm_invoice_entry(p_store_id uuid, p_items jsonb, p_notes text)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_item jsonb;
  v_product_id uuid;
  v_qty integer;
  v_cost numeric;
  v_count integer := 0;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'informe ao menos um item';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item ->> 'qty')::integer;
    v_cost := (v_item ->> 'unit_cost')::numeric;
    if v_qty is null or v_qty <= 0 then
      raise exception 'quantidade inválida no SKU %', v_item ->> 'sku';
    end if;
    if v_cost is null or v_cost < 0 then
      raise exception 'custo inválido no SKU %', v_item ->> 'sku';
    end if;

    if v_item ->> 'match' = 'existing' then
      select id into v_product_id from public.products
        where sku = v_item ->> 'sku' and tenant_id = public.auth_tenant_id();
      if v_product_id is null then
        raise exception 'SKU % não encontrado no catálogo', v_item ->> 'sku';
      end if;
    else
      insert into public.products (tenant_id, category_id, sku, brand, name, attrs, cost_price, sale_price, min_stock)
      values (
        public.auth_tenant_id(), (v_item ->> 'category_id')::uuid, v_item ->> 'sku', '',
        v_item ->> 'product_name', coalesce(v_item -> 'attributes', '{}'::jsonb), v_cost, v_cost, 0
      )
      returning id into v_product_id;
    end if;

    perform public.fn_stock_entry(p_store_id, v_product_id, v_qty, v_cost, p_notes);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- Produtos vendidos numa loja desde uma data — substitui o select de
-- `sales` + `sale_items` no Node, que o PostgREST cortava em 1000 linhas
-- (estoque parado aparecia errado em loja com muita venda).
create or replace function public.fn_products_sold_since(p_store_id uuid, p_since timestamptz)
returns setof uuid
language sql
stable
set search_path = public
as $$
  select distinct si.product_id
  from public.sale_items si
  join public.sales s on s.id = si.sale_id
  where s.store_id = p_store_id and s.created_at >= p_since;
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.fn_create_supplier(jsonb, uuid[])',
    'public.fn_set_supplier_categories(uuid, uuid[])',
    'public.fn_set_location_categories(uuid, uuid[])',
    'public.fn_create_category(jsonb, jsonb)',
    'public.fn_confirm_invoice_entry(uuid, jsonb, text)',
    'public.fn_products_sold_since(uuid, timestamptz)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end;
$$;

-- Billing sem service-role no caminho do tenant: o app lê via RLS e só
-- estes dois pontos precisam passar por cima dela.
-- fn_billing_owner_email: email do proprietário mais antigo (auth.users não
-- é legível pelo tenant) pra preencher o customer do Stripe.
-- fn_link_billing_customer: grava o mapeamento tenant→customer se ainda
-- não houver e devolve o vencedor (dois checkouts simultâneos → o perdedor
-- descarta o customer que criou).
create or replace function public.fn_billing_owner_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email::text
  from public.store_users su
  join auth.users u on u.id = su.user_id
  where su.tenant_id = public.auth_tenant_id()
    and su.role = 'proprietario'
    and public.has_access('billing', 2)
  order by su.joined_at nulls last, su.invited_at nulls last
  limit 1;
$$;

create or replace function public.fn_link_billing_customer(p_stripe_customer_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_winner text;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('billing', 2) then
    raise exception 'not authorized';
  end if;
  if coalesce(p_stripe_customer_id, '') !~ '^cus_[A-Za-z0-9]+$' then
    raise exception 'customer inválido';
  end if;
  insert into public.billing_customers (tenant_id, stripe_customer_id)
  values (v_tenant_id, p_stripe_customer_id)
  on conflict (tenant_id) do nothing;
  select stripe_customer_id into v_winner from public.billing_customers where tenant_id = v_tenant_id;
  return v_winner;
end;
$$;

revoke execute on function public.fn_billing_owner_email() from public, anon;
grant execute on function public.fn_billing_owner_email() to authenticated;
revoke execute on function public.fn_link_billing_customer(text) from public, anon;
grant execute on function public.fn_link_billing_customer(text) to authenticated;
