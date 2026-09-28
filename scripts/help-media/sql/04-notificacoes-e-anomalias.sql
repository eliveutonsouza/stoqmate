-- Empresa demo — parte 4: avisos na caixa de notificações e rupturas para a
-- tela de anomalias. O preenchimento não cruza o mínimo de nenhum produto, então
-- os avisos entram direto (como postgres, restrito ao tenant demo). As rupturas
-- saem de ajustes reais (fn_stock_adjustment), como o gestor faria.
with t as (select tenant_id id from public.profiles where id = (select id from auth.users where email = 'demo-ajuda@stoqmate-qa.com.br')),
s as (select id, name from public.stores where tenant_id = (select id from t)),
p as (select id, sku from public.products where tenant_id = (select id from t))
insert into public.notifications (tenant_id, store_id, kind, title, message, target_type, target_id, created_at, read_at)
select (select id from t), (select id from s where name = v.store), v.kind, v.title, v.msg, v.ttype, (select id from p where sku = v.sku),
       now() - v.ago, case when v.read then now() - v.ago + interval '1 hour' end
from (values
  ('Loja Centro', 'low_stock', 'Estoque abaixo do mínimo', 'Fone Bluetooth ANC em Loja Centro caiu para 2 unidade(s) (mínimo 10).', 'product', 'ELE-FONEAN-PR-128', interval '2 hours', false),
  ('Loja Centro', 'low_stock', 'Estoque abaixo do mínimo', 'Carregador GaN 65W em Loja Centro caiu para 3 unidade(s) (mínimo 12).', 'product', 'ELE-CARREG-BR-65W', interval '5 hours', false),
  ('Loja Centro', 'out_of_stock', 'Produto em ruptura', 'Tênis Esporte 3 em Loja Centro caiu para 0 unidade(s) (mínimo 4).', 'product', 'CAL-TENISE-PR-38', interval '1 day', false),
  ('Loja Shopping Norte', 'cash_discrepancy', 'Diferença no caixa', 'Loja Shopping Norte fechou o turno com falta de R$ 12,50. Justificativa: troco dado a mais.', 'cash_session', null, interval '2 days', true),
  (null, 'access_request', 'Pedido de acesso', 'Lucas Martins (Vendedor) pediu acesso a Relatórios · Lucratividade.', 'user', null, interval '3 days', true),
  ('Loja Campinas', 'low_stock', 'Estoque abaixo do mínimo', 'Café em Grãos em Loja Campinas caiu para 3 unidade(s) (mínimo 3).', 'product', 'ALI-CAFEGR-IN-5KG', interval '4 days', true)
) v(store, kind, title, msg, ttype, sku, ago, read);

select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'demo-ajuda@stoqmate-qa.com.br'), 'role', 'authenticated')::text, true);
set local role authenticated;
select public.fn_stock_adjustment((select id from public.stores where name = 'Loja Centro' and tenant_id = public.auth_tenant_id()),
  (select id from public.products where sku = 'CAL-TENISE-PR-38' and tenant_id = public.auth_tenant_id()), 0,
  'Furto / extravio', 'Par de exposição não localizado na parede C-01 após contagem do fechamento.');
select public.fn_stock_adjustment((select id from public.stores where name = 'Loja Campinas' and tenant_id = public.auth_tenant_id()),
  (select id from public.products where sku = 'ELE-SMARTX-AZ-256' and tenant_id = public.auth_tenant_id()), 0,
  'Avaria', 'Aparelho de vitrine com tela trincada enviado para assistência técnica.');
