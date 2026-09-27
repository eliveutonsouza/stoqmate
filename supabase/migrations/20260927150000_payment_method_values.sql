-- Valores novos de enum ficam num arquivo próprio: o Postgres não deixa usar
-- um valor recém-criado na mesma transação em que ele foi adicionado.
--
-- payment_method:
--   credito_loja — venda paga (ou troca/devolução acertada) com o saldo de
--                  crédito do cliente (customer_credit_ledger).
--   outro        — forma registrada que não é nenhuma das anteriores
--                  (vale-presente, permuta, "acertado fora do sistema").
-- cash_movement_kind:
--   refund       — dinheiro que saiu do caixa pra devolver ao cliente
--                  (devolução ou troca com diferença a favor dele).
alter type public.payment_method add value if not exists 'credito_loja';
alter type public.payment_method add value if not exists 'outro';
alter type public.cash_movement_kind add value if not exists 'refund';
