-- View agregada de compras por cliente — evita trazer todas as linhas de
-- `sales` pro cliente só para somar/contar. `security_invoker` mantém a
-- RLS de `sales` rodando com o papel de quem consulta a view.
create view public.customer_stats
with (security_invoker = true) as
select
  tenant_id, customer_id,
  count(*) as purchases_count,
  sum(total) as total_spent,
  max(created_at) as last_purchase_at
from public.sales
where customer_id is not null
group by tenant_id, customer_id;

grant select on public.customer_stats to authenticated;
