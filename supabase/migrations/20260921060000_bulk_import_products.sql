-- ============================================================
-- fn_bulk_import_products — /products/import saía do mock com uma
-- wizard de 4 passos inteiramente decorativa (arquivo fake, "1.270
-- produtos importados" fixo no código, nunca gravava nada). A versão
-- real simplifica pra CSV com colunas fixas e documentadas (em vez de
-- mapeamento livre de coluna arbitrária) — trade-off deliberado pra
-- entregar algo real sem inventar um parser de XLSX/mapeamento
-- genérico. `category_code` precisa bater com uma categoria já
-- cadastrada (código curto, ex.: ELE, VES) — categoria nova não é
-- criada automaticamente aqui, precisa existir antes.
-- ============================================================

create function public.fn_bulk_import_products(
  p_store_id uuid, p_items jsonb, p_on_duplicate text default 'update'
)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
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
      select coalesce((select qty from public.stock_balances where product_id = v_product_id and store_id = p_store_id), 0) into v_before;
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
$$;

grant execute on function public.fn_bulk_import_products(uuid, jsonb, text) to authenticated;
