-- ============================================================
-- fn_bulk_price_update — /products/pricing saía do mock (`CATALOG`
-- estático, nenhum onChange real, "Aplicar" só navegava). Escopo
-- reduzido a fornecedor/categoria/marca (todas colunas reais) — "classe
-- ABC" foi cortado por não ter coluna persistida (só existe como
-- relatório calculado, fn_abc_report) e a promessa de "reverter em até
-- 7 dias" também foi removida da UI por não existir mecanismo de
-- desfazer em lote.
-- ============================================================

create function public.fn_bulk_price_update(
  p_scope text, p_scope_value text, p_mode text, p_pct numeric, p_rounding text
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_product record;
  v_new_cost numeric;
  v_new_sale numeric;
  v_count integer := 0;
  v_margin_before_sum numeric := 0;
  v_margin_after_sum numeric := 0;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('catalog', 2) then
    raise exception 'not authorized';
  end if;
  if p_scope not in ('supplier', 'category', 'brand') then
    raise exception 'escopo inválido';
  end if;
  if p_mode not in ('cost', 'sale', 'margin') then
    raise exception 'modo de reajuste inválido';
  end if;
  if p_mode = 'margin' and p_pct >= 100 then
    raise exception 'margem alvo precisa ser menor que 100 por cento';
  end if;

  for v_product in
    select * from public.products p
    where p.tenant_id = v_tenant_id and p.active
      and (
        (p_scope = 'supplier' and p.supplier_id = p_scope_value::uuid)
        or (p_scope = 'category' and p.category_id = p_scope_value::uuid)
        or (p_scope = 'brand' and p.brand = p_scope_value)
      )
  loop
    if p_mode = 'cost' then
      v_new_cost := v_product.cost_price * (1 + p_pct / 100);
      v_new_sale := v_product.sale_price * (1 + p_pct / 100);
    elsif p_mode = 'sale' then
      v_new_cost := v_product.cost_price;
      v_new_sale := v_product.sale_price * (1 + p_pct / 100);
    else -- margin
      v_new_cost := v_product.cost_price;
      v_new_sale := case when p_pct < 100 then v_product.cost_price / (1 - p_pct / 100) else v_product.sale_price end;
    end if;

    v_new_sale := case p_rounding
      when '90' then floor(v_new_sale) + 0.90
      when '99' then floor(v_new_sale) + 0.99
      when '5' then round(v_new_sale / 5) * 5
      else round(v_new_sale, 2)
    end;

    if v_product.sale_price > 0 then
      v_margin_before_sum := v_margin_before_sum + ((v_product.sale_price - v_product.cost_price) / v_product.sale_price) * 100;
    end if;
    if v_new_sale > 0 then
      v_margin_after_sum := v_margin_after_sum + ((v_new_sale - v_new_cost) / v_new_sale) * 100;
    end if;

    update public.products set cost_price = v_new_cost, sale_price = v_new_sale where id = v_product.id;
    v_count := v_count + 1;
  end loop;

  if v_count > 0 then
    perform public.fn_write_audit(
      'price_bulk',
      format('Reajuste em lote de %s SKUs (%s, %s%%)', v_count, p_mode, p_pct),
      'bulk_price_update', null
    );
  end if;

  return jsonb_build_object(
    'count', v_count,
    'avg_margin_before', case when v_count > 0 then v_margin_before_sum / v_count else null end,
    'avg_margin_after', case when v_count > 0 then v_margin_after_sum / v_count else null end
  );
end;
$$;

grant execute on function public.fn_bulk_price_update(text, text, text, numeric, text) to authenticated;
