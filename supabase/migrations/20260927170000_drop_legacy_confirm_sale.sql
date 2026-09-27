-- Depois do deploy do app que manda `p_payments`: a assinatura antiga de
-- fn_confirm_sale (p_payment_method text) sai. Ela ficou viva só pra não
-- quebrar vendas entre a migration 20260927150100 e o deploy.
--
-- Vendas feitas pela versão antiga nesse intervalo não gravaram linha em
-- `payments`; o backfill abaixo cria uma linha com o método e o total da
-- venda, como foi feito pro histórico.
insert into public.payments (tenant_id, store_id, document_type, document_id, direction, method, amount, installments, customer_id, created_by, created_at)
select s.tenant_id, s.store_id, 'sale', s.id, 'in', s.payment_method, s.total, greatest(coalesce(s.installments, 1), 1), s.customer_id, s.created_by, s.created_at
from public.sales s
where s.total > 0
  and not exists (select 1 from public.payments p where p.document_type = 'sale' and p.document_id = s.id);

drop function if exists public.fn_confirm_sale(uuid, uuid, text, integer, uuid, text, jsonb, numeric, uuid);
