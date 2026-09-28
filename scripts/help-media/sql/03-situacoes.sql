-- Empresa demo — parte 3: situações que os tutoriais mostram (promoções,
-- transferência pendente, pedido enviado, caixa aberto, ajuste, devolução,
-- troca, crédito de cliente e convites da equipe).
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'demo-ajuda@stoqmate-qa.com.br'), 'role', 'authenticated')::text, true);
set local role authenticated;

do $$
declare
  t uuid := public.auth_tenant_id();
  s_centro uuid; s_norte uuid; s_camp uuid; s_cd uuid;
  pid uuid; po uuid; tr uuid; cust uuid; ses uuid;
  price numeric;
  sku_id jsonb;
begin
  select id into s_centro from stores where tenant_id = t and name = 'Loja Centro';
  select id into s_norte from stores where tenant_id = t and name = 'Loja Shopping Norte';
  select id into s_camp from stores where tenant_id = t and name = 'Loja Campinas';
  select id into s_cd from stores where tenant_id = t and name = 'Centro de Distribuição';
  select jsonb_object_agg(sku, id) into sku_id from products where tenant_id = t;

  -- Promoções: ativa, agendada e (depois, fora do papel) uma encerrada
  perform public.fn_promotion_create('Semana do Fone', 'product', (sku_id->>'ELE-FONEAN-BR-128')::uuid, null, 299.9, now() - interval '3 days', now() + interval '11 days', false);
  perform public.fn_promotion_create('Queima Moletom Preto', 'product', (sku_id->>'VES-MOLETO-PR-M')::uuid, null, 179.9, now() + interval '5 days', now() + interval '20 days', false);
  perform public.fn_promotion_create('Liquida Inverno', 'product', (sku_id->>'VES-JAQUET-BE-M')::uuid, null, 249.9, now() - interval '40 days', now() - interval '10 days', false);

  -- Transferência recebida (histórico) e uma pendente CD → Loja Centro
  tr := public.fn_transfer_dispatch(s_cd, s_norte, jsonb_build_array(jsonb_build_object('product_id', sku_id->>'VES-CAMISE-PR-M', 'qty', 12)), 'Reposição de loja', 'Malha interna', null);
  perform public.fn_transfer_receive(tr, (select jsonb_agg(jsonb_build_object('transfer_item_id', id, 'qty_received', qty_sent)) from transfer_items where transfer_id = tr), null, null);
  perform public.fn_transfer_dispatch(s_cd, s_centro, jsonb_build_array(
    jsonb_build_object('product_id', sku_id->>'ELE-FONEAN-PR-128', 'qty', 20),
    jsonb_build_object('product_id', sku_id->>'ELE-CARREG-BR-65W', 'qty', 15)), 'Ruptura na loja', 'Malha interna', 'Chega amanhã cedo');

  -- Pedido de compra enviado (aguardando nota) e um já recebido
  perform public.fn_purchase_order_create(s_centro, (select id from suppliers where tenant_id = t and name = 'TechDistrib'),
    jsonb_build_array(jsonb_build_object('product_id', sku_id->>'ELE-FONEAN-PR-128', 'qty', 40), jsonb_build_object('product_id', sku_id->>'ELE-CARREG-BR-65W', 'qty', 60),
      jsonb_build_object('product_id', sku_id->>'ELE-FONEAN-BR-128', 'qty', 24), jsonb_build_object('product_id', sku_id->>'ELE-PENDRI-PR-64', 'qty', 30)),
    'Entregar pela doca lateral', 45);
  po := public.fn_purchase_order_create(s_centro, (select id from suppliers where tenant_id = t and name = 'Grão Nobre Cafés'),
    jsonb_build_array(jsonb_build_object('product_id', sku_id->>'ALI-CAFEGR-TR-500', 'qty', 24), jsonb_build_object('product_id', sku_id->>'ALI-CAFEGR-IN-1KG', 'qty', 12)),
    null, 0);
  perform public.fn_purchase_order_receive(po, (select jsonb_agg(jsonb_build_object('order_item_id', id, 'qty_received', qty_ordered)) from purchase_order_items where order_id = po));

  -- Ajuste, devolução e troca
  perform public.fn_stock_adjustment(s_centro, (sku_id->>'ALI-CAFEGR-DE-500')::uuid,
    (select qty - 2 from stock_balances where store_id = s_centro and product_id = (sku_id->>'ALI-CAFEGR-DE-500')::uuid),
    'Avaria', 'Duas embalagens rasgadas encontradas na gôndola D-01 durante a reposição.');
  perform public.fn_stock_return(s_norte, (sku_id->>'CAL-TENISE-PR-40')::uuid, 1, 'Defeito de fabricação', false, 'Solado descolando', null, '[]'::jsonb);
  perform public.fn_stock_exchange(s_centro, (sku_id->>'VES-CAMISE-PR-M')::uuid, (sku_id->>'VES-CAMISE-PR-G')::uuid, 1, 'Tamanho errado', null, null, '[]'::jsonb);

  -- Crédito em loja
  select id into cust from customers where tenant_id = t and name = 'Mariana Souza';
  perform public.fn_customer_credit_adjust(cust, 150, 'Devolução de compra anterior');
  select id into cust from customers where tenant_id = t and name = 'Construtora Horizonte Ltda';
  perform public.fn_customer_credit_adjust(cust, 420, 'Crédito manual — bonificação de contrato');

  -- Caixa aberto na Loja Centro com duas vendas em dinheiro hoje
  ses := public.fn_cash_session_open(s_centro, 200);
  select sale_price into price from products where id = (sku_id->>'ALI-CAFEGR-TR-500')::uuid;
  perform public.fn_confirm_sale(s_centro, null, jsonb_build_array(jsonb_build_object('method', 'dinheiro', 'amount', price * 2)), null,
    jsonb_build_array(jsonb_build_object('product_id', sku_id->>'ALI-CAFEGR-TR-500', 'qty', 2, 'unit_price', price, 'discount_pct', 0)), 0, null);
  select sale_price into price from products where id = (sku_id->>'ELE-PENDRI-PR-64')::uuid;
  perform public.fn_confirm_sale(s_centro, null, jsonb_build_array(jsonb_build_object('method', 'dinheiro', 'amount', price)), null,
    jsonb_build_array(jsonb_build_object('product_id', sku_id->>'ELE-PENDRI-PR-64', 'qty', 1, 'unit_price', price, 'discount_pct', 0)), 0, null);

  -- Equipe (convites pendentes; os usuários aceitam pelo link /invite)
  perform public.fn_team_invite('demo-vendedor@stoqmate-qa.com.br', 'Lucas Martins', 'vendedor');
  perform public.fn_team_invite('demo-estoque@stoqmate-qa.com.br', 'Bruna Tavares', 'estoquista');
  perform public.fn_team_invite('demo-financeiro@stoqmate-qa.com.br', 'Rogério Nunes', 'financeiro');
end $$;
