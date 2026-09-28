-- Empresa demo — parte 2: histórico de vendas pelas RPCs reais (fn_confirm_sale),
-- depois retrodatado. Troque __FROM__ e __TO__ (dias atrás) antes de rodar;
-- em blocos para caber no timeout: 90→61 e depois 60→1. No primeiro bloco,
-- retrodate também o saldo de abertura:
--   update public.stock_movements set created_at = now() - interval '95 days'
--    where kind = 'entry' and tenant_id = <tenant demo>;
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'demo-ajuda@stoqmate-qa.com.br'), 'role', 'authenticated')::text, true);
set local role authenticated;
create temp table if not exists demo_sale_dates (sale_id uuid, ts timestamptz) on commit drop;

do $$
declare
  t uuid := public.auth_tenant_id();
  st record; d int; n int; i int; k int; items jsonb; total numeric; sid uuid; ts timestamptz;
  pr record; q int; method text; cust uuid; weight numeric;
begin
  perform setseed(0.37 + __FROM__ / 1000.0);
  for d in reverse __FROM__ .. __TO__ loop
    for st in select id, name from stores where tenant_id = t and type = 'loja' order by created_at loop
      weight := case st.name when 'Loja Centro' then 1.4 when 'Loja Shopping Norte' then 1.1 else 0.7 end;
      n := greatest(1, round(random() * 3 * weight + (case when extract(dow from now() - d * interval '1 day') in (5, 6) then 2 else 0 end))::int);
      for i in 1 .. n loop
        items := '[]'::jsonb; total := 0;
        for k in 1 .. (1 + floor(random() * 2.2))::int loop
          select p.id, p.sale_price, b.qty into pr
            from products p join stock_balances b on b.product_id = p.id and b.store_id = st.id
           where p.tenant_id = t and b.qty > 2
             and not (items @> jsonb_build_array(jsonb_build_object('product_id', p.id)))
             -- estoque fantasma: a camiseta branca M para de vender na Loja Centro nos últimos 11 dias
             and not (p.sku = 'VES-CAMISE-BR-M' and st.name = 'Loja Centro' and d <= 11)
           order by random() * (case when p.sale_price < 120 then 1.0 else 2.2 end) limit 1;
          exit when pr.id is null;
          q := case when pr.sale_price < 120 and random() < 0.35 then 2 else 1 end;
          items := items || jsonb_build_array(jsonb_build_object('product_id', pr.id, 'qty', q, 'unit_price', pr.sale_price, 'discount_pct', 0));
          total := total + q * pr.sale_price;
        end loop;
        continue when jsonb_array_length(items) = 0;
        method := (array['pix', 'pix', 'debito', 'credito', 'credito'])[1 + floor(random() * 5)::int];
        cust := case when random() < 0.18 then (select id from customers where tenant_id = t order by random() limit 1) end;
        sid := public.fn_confirm_sale(st.id, cust,
          jsonb_build_array(jsonb_build_object('method', method, 'amount', round(total, 2), 'installments', case when method = 'credito' then 1 + floor(random() * 3)::int else 1 end)),
          null, items, 0, null);
        ts := date_trunc('day', now() - d * interval '1 day') + interval '9 hours' + random() * interval '11 hours';
        insert into demo_sale_dates values (sid, ts);
      end loop;
    end loop;
  end loop;
end $$;

reset role;
update public.sales s set created_at = x.ts from demo_sale_dates x where s.id = x.sale_id;
update public.stock_movements m set created_at = x.ts from demo_sale_dates x where m.reference_id = x.sale_id;
update public.payments p set created_at = x.ts from demo_sale_dates x where p.document_id = x.sale_id;
