-- Remove a empresa demo da central de ajuda e os 4 usuários dela.
-- ATENÇÃO: apaga dados de verdade. Confira o tenant antes (o select abaixo) e
-- rode dentro de uma transação. Todas as tabelas do tenant têm FK com
-- `on delete cascade` para tenants; profiles não, por isso vão antes.
begin;
select id, name from public.tenants
 where id in (select tenant_id from public.profiles where id in (select id from auth.users where email = 'demo-ajuda@stoqmate-qa.com.br'));

create temp table demo_tenant on commit drop as
  select tenant_id as id from public.profiles where id = (select id from auth.users where email = 'demo-ajuda@stoqmate-qa.com.br');
delete from public.profiles where tenant_id in (select id from demo_tenant);
delete from public.tenants where id in (select id from demo_tenant);
delete from auth.users where email in (
  'demo-ajuda@stoqmate-qa.com.br', 'demo-vendedor@stoqmate-qa.com.br',
  'demo-estoque@stoqmate-qa.com.br', 'demo-financeiro@stoqmate-qa.com.br');
commit;
