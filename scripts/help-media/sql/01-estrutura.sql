-- Empresa demo da central de ajuda — parte 1: unidades, locais, fornecedores,
-- produtos, saldo inicial e clientes. Roda como o proprietário demo
-- (RLS e RPCs reais), nunca como service role. Idempotência: rode só uma vez
-- por tenant; para refazer, use 99-limpeza.sql e crie a conta de novo.
-- Renomeia a loja criada no cadastro (stores/tenants não aceitam UPDATE do app).
update public.stores set name = 'Loja Centro', city = 'São Paulo · SP'
 where tenant_id = (select tenant_id from public.profiles where id = (select id from auth.users where email = 'demo-ajuda@stoqmate-qa.com.br'));
update public.tenants set city = 'São Paulo', state = 'SP', segment = 'Varejo multicategoria'
 where id = (select tenant_id from public.profiles where id = (select id from auth.users where email = 'demo-ajuda@stoqmate-qa.com.br'));

select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'demo-ajuda@stoqmate-qa.com.br'), 'role', 'authenticated')::text, true);
set local role authenticated;

do $$
declare
  t uuid := public.auth_tenant_id();
  s_centro uuid; s_norte uuid; s_camp uuid; s_cd uuid;
  c_ele uuid; c_cal uuid; c_ves uuid; c_ali uuid;
  f_tech uuid; f_moda uuid; f_passo uuid; f_grao uuid;
  loc uuid; p uuid; r record;
begin
  select id into s_centro from stores where tenant_id = t order by created_at limit 1;
  s_norte := public.fn_create_store('Loja Shopping Norte', 'loja', 'São Paulo · SP', '');
  s_camp  := public.fn_create_store('Loja Campinas', 'loja', 'Campinas · SP', '');
  s_cd    := public.fn_create_store('Centro de Distribuição', 'cd', 'Guarulhos · SP', '');

  select id into c_ele from categories where tenant_id = t and code = 'ELE';
  select id into c_cal from categories where tenant_id = t and code = 'CAL';
  select id into c_ves from categories where tenant_id = t and code = 'VES';
  select id into c_ali from categories where tenant_id = t and code = 'ALI';

  insert into locations (tenant_id, store_id, code, description) values
    (t, s_centro, 'A-01', 'Corredor A · vitrine eletrônicos'), (t, s_centro, 'A-05', 'Corredor A · acessórios'),
    (t, s_centro, 'B-02', 'Corredor B · vestuário'), (t, s_centro, 'C-01', 'Parede C · calçados'),
    (t, s_centro, 'D-01', 'Gôndola D · mercearia'), (t, s_cd, 'R-01', 'Rua 1 · paletes'), (t, s_cd, 'R-02', 'Rua 2 · prateleiras');

  f_tech  := public.fn_create_supplier(jsonb_build_object('name', 'TechDistrib', 'cnpj', '12.345.678/0001-90', 'phone', '(11) 3222-1000', 'order_email', 'pedidos@techdistrib.com.br', 'sales_rep', 'Rafael Lima', 'brands', jsonb_build_array('JBL', 'Anker', 'Samsung', 'SanDisk'), 'lead_time_days', 7, 'min_order_value', 1500, 'payment_terms', '30/60'), array[c_ele]);
  f_moda  := public.fn_create_supplier(jsonb_build_object('name', 'Moda Sul Confecções', 'cnpj', '23.456.789/0001-01', 'phone', '(47) 3333-2000', 'order_email', 'vendas@modasul.com.br', 'sales_rep', 'Carla Mendes', 'brands', jsonb_build_array('Pima Co.', 'Flanel'), 'lead_time_days', 10, 'min_order_value', 800, 'payment_terms', '28'), array[c_ves]);
  f_passo := public.fn_create_supplier(jsonb_build_object('name', 'Passo Firme Calçados', 'cnpj', '34.567.890/0001-12', 'phone', '(51) 3444-3000', 'order_email', 'comercial@passofirme.com.br', 'sales_rep', 'Jorge Alves', 'brands', jsonb_build_array('Esporte', 'Urbano'), 'lead_time_days', 14, 'min_order_value', 2000, 'payment_terms', '30/60/90'), array[c_cal]);
  f_grao  := public.fn_create_supplier(jsonb_build_object('name', 'Grão Nobre Cafés', 'cnpj', '45.678.901/0001-23', 'phone', '(35) 3555-4000', 'order_email', 'pedido@graonobre.com.br', 'brands', jsonb_build_array('Grão Nobre'), 'lead_time_days', 5, 'min_order_value', 400, 'payment_terms', 'À vista'), array[c_ali]);

  -- sku, cat, supplier, brand, name, attrs, custo, venda, mínimo, ean, local, qtd centro/norte/campinas/cd
  for r in select * from (values
    ('ELE-FONEAN-PR-128', c_ele, f_tech, 'JBL', 'Fone Bluetooth ANC', '{"cor":"Preto","capacidade":"128 GB"}', 189.0, 349.9, 10, '7891000100011', 'A-01', 2, 28, 9, 164),
    ('ELE-FONEAN-BR-128', c_ele, f_tech, 'JBL', 'Fone Bluetooth ANC', '{"cor":"Branco","capacidade":"128 GB"}', 189.0, 349.9, 8, '7891000100028', 'A-01', 14, 11, 6, 40),
    ('ELE-SMARTX-PR-128', c_ele, f_tech, 'Samsung', 'Smartphone X12', '{"cor":"Preto","capacidade":"128 GB"}', 1290.0, 1999.0, 4, '7891000100035', 'A-01', 6, 5, 3, 22),
    ('ELE-SMARTX-AZ-256', c_ele, f_tech, 'Samsung', 'Smartphone X12', '{"cor":"Azul","capacidade":"256 GB"}', 1490.0, 2299.0, 3, '7891000100042', 'A-01', 4, 3, 2, 12),
    ('ELE-PENDRI-PR-64', c_ele, f_tech, 'SanDisk', 'Pendrive Ultra', '{"cor":"Preto","capacidade":"64 GB"}', 24.0, 49.9, 20, '7891000100059', 'A-05', 45, 38, 30, 200),
    ('ELE-PENDRI-PR-128', c_ele, f_tech, 'SanDisk', 'Pendrive Ultra', '{"cor":"Preto","capacidade":"128 GB"}', 38.0, 79.9, 15, '7891000100066', 'A-05', 32, 25, 18, 150),
    ('ELE-SSDEXT-CZ-1TB', c_ele, f_tech, 'SanDisk', 'SSD Externo Portátil', '{"cor":"Cinza","capacidade":"1 TB"}', 420.0, 699.0, 5, '7891000100073', 'A-05', 7, 4, 3, 25),
    ('ELE-CARREG-BR-64', c_ele, f_tech, 'Anker', 'Carregador GaN 65W', '{"cor":"Branco"}', 74.5, 159.9, 12, '7891000100080', 'A-05', 3, 19, 15, 90),
    ('CAL-TENISE-PR-38', c_cal, f_passo, 'Esporte', 'Tênis Esporte 3', '{"cor":"Preto","numeracao":"38"}', 139.0, 279.9, 4, '7891000200018', 'C-01', 1, 4, 26, 36),
    ('CAL-TENISE-PR-40', c_cal, f_passo, 'Esporte', 'Tênis Esporte 3', '{"cor":"Preto","numeracao":"40"}', 139.0, 279.9, 4, '7891000200025', 'C-01', 9, 7, 8, 30),
    ('CAL-TENISE-PR-42', c_cal, f_passo, 'Esporte', 'Tênis Esporte 3', '{"cor":"Preto","numeracao":"42"}', 139.0, 279.9, 4, '7891000200032', 'C-01', 8, 6, 5, 24),
    ('CAL-TENISE-BR-39', c_cal, f_passo, 'Esporte', 'Tênis Esporte 3', '{"cor":"Branco","numeracao":"39"}', 139.0, 279.9, 3, '7891000200049', 'C-01', 6, 5, 4, 20),
    ('CAL-SAPATE-CZ-41', c_cal, f_passo, 'Urbano', 'Sapatênis Casual', '{"cor":"Cinza","numeracao":"41"}', 98.0, 199.9, 3, '7891000200056', 'C-01', 5, 4, 3, 18),
    ('CAL-SAPATE-AZ-42', c_cal, f_passo, 'Urbano', 'Sapatênis Casual', '{"cor":"Azul Marinho","numeracao":"42"}', 98.0, 199.9, 3, '7891000200063', 'C-01', 4, 3, 2, 14),
    ('VES-CAMISE-BR-M', c_ves, f_moda, 'Pima Co.', 'Camiseta Algodão Pima', '{"cor":"Branco","tamanho":"M"}', 42.0, 99.9, 10, '7891000300015', 'B-02', 204, 42, 6, 88),
    ('VES-CAMISE-BR-G', c_ves, f_moda, 'Pima Co.', 'Camiseta Algodão Pima', '{"cor":"Branco","tamanho":"G"}', 42.0, 99.9, 10, '7891000300022', 'B-02', 24, 20, 14, 60),
    ('VES-CAMISE-PR-M', c_ves, f_moda, 'Pima Co.', 'Camiseta Algodão Pima', '{"cor":"Preto","tamanho":"M"}', 42.0, 99.9, 10, '7891000300039', 'B-02', 26, 22, 18, 70),
    ('VES-CAMISE-PR-G', c_ves, f_moda, 'Pima Co.', 'Camiseta Algodão Pima', '{"cor":"Preto","tamanho":"G"}', 42.0, 99.9, 10, '7891000300046', 'B-02', 18, 16, 12, 50),
    ('VES-MOLETO-CZ-G', c_ves, f_moda, 'Flanel', 'Moletom Flanelado', '{"cor":"Cinza","tamanho":"G"}', 89.0, 229.9, 5, '7891000300053', 'B-02', 38, 12, 9, 30),
    ('VES-MOLETO-PR-M', c_ves, f_moda, 'Flanel', 'Moletom Flanelado', '{"cor":"Preto","tamanho":"M"}', 89.0, 229.9, 5, '7891000300060', 'B-02', 11, 9, 7, 24),
    ('VES-JAQUET-BE-M', c_ves, f_moda, 'Flanel', 'Jaqueta Corta-vento', '{"cor":"Bege","tamanho":"M"}', 119.0, 289.9, 4, '7891000300077', 'B-02', 6, 5, 4, 16),
    ('ALI-CAFEGR-IN-1KG', c_ali, f_grao, 'Grão Nobre', 'Café em Grãos', '{"sabor":"Intenso","peso":"1 kg"}', 48.0, 89.9, 12, '7891000400012', 'D-01', 20, 16, 12, 60),
    ('ALI-CAFEGR-IN-5KG', c_ali, f_grao, 'Grão Nobre', 'Café em Grãos', '{"sabor":"Intenso","peso":"5 kg"}', 210.0, 379.9, 3, '7891000400029', 'D-01', 2, 6, 3, 48),
    ('ALI-CAFEGR-TR-500', c_ali, f_grao, 'Grão Nobre', 'Café em Grãos', '{"sabor":"Tradicional","peso":"500 g"}', 26.0, 49.9, 15, '7891000400036', 'D-01', 34, 28, 22, 90),
    ('ALI-CAFEGR-DE-500', c_ali, f_grao, 'Grão Nobre', 'Café em Grãos', '{"sabor":"Descafeinado","peso":"500 g"}', 29.0, 54.9, 8, '7891000400043', 'D-01', 12, 9, 7, 30),
    ('ALI-CHAFRU-FV-250', c_ali, f_grao, 'Grão Nobre', 'Chá de Frutas', '{"sabor":"Frutas Vermelhas","peso":"250 g"}', 12.0, 27.9, 10, '7891000400050', 'D-01', 25, 20, 18, 80)
  ) v(sku, cat, sup, brand, name, attrs, cost, price, mn, ean, loc_code, q_centro, q_norte, q_camp, q_cd)
  loop
    select id into loc from locations where tenant_id = t and store_id = s_centro and code = r.loc_code;
    insert into products (tenant_id, category_id, supplier_id, default_location_id, sku, barcode, brand, name, attrs, cost_price, sale_price, min_stock)
    values (t, r.cat, r.sup, loc, r.sku, r.ean, r.brand, r.name, r.attrs::jsonb, r.cost, r.price, r.mn)
    returning id into p;
    -- saldo inicial alto: as vendas dos 90 dias trazem para o saldo-alvo depois
    perform public.fn_stock_entry(s_centro, p, r.q_centro + 60, r.cost, 'Saldo de abertura');
    perform public.fn_stock_entry(s_norte, p, r.q_norte + 40, r.cost, 'Saldo de abertura');
    perform public.fn_stock_entry(s_camp, p, r.q_camp + 30, r.cost, 'Saldo de abertura');
    perform public.fn_stock_entry(s_cd, p, r.q_cd, r.cost, 'Saldo de abertura');
  end loop;

  perform public.fn_customer_create('Mariana Souza', '123.456.789-09', '(11) 98888-1010', 'mariana.souza@email.com', 'Prefere contato por WhatsApp');
  perform public.fn_customer_create('Construtora Horizonte Ltda', '11.222.333/0001-44', '(11) 3030-4040', 'compras@horizonte.com.br', 'Compra café 5 kg todo mês');
  perform public.fn_customer_create('Pedro Almeida', '987.654.321-00', '(11) 97777-2020', null, null);
  perform public.fn_customer_create('Juliana Costa', '321.654.987-11', '(19) 96666-3030', 'ju.costa@email.com', null);
  perform public.fn_customer_create('Escritório Contábil Prisma', '22.333.444/0001-55', '(11) 3131-5151', 'adm@prisma.com.br', null);

end $$;
