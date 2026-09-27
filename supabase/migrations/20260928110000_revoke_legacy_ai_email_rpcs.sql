-- Pós-deploy da auditoria (20260928100000): o app já usa as versões de
-- servidor (fn_ai_refund_credits_for, fn_write_ai_usage_for,
-- fn_claim_notification_emails_svc, fn_record_notification_email_result_svc,
-- só service_role). As antigas saem de authenticated:
--   - fn_ai_refund_credits: o usuário estornava o próprio crédito depois de
--     uma resposta bem-sucedida;
--   - fn_write_ai_usage: aceitava custo/uso inventado;
--   - fn_claim_notification_emails: qualquer usuário da rede lia o email dos
--     proprietários e marcava a fila como enviada;
--   - fn_record_notification_email_result: gravava erro em aviso alheio.
revoke execute on function public.fn_ai_refund_credits(text) from authenticated;
revoke execute on function public.fn_write_ai_usage(text, text, integer, integer, numeric, text, text, integer) from authenticated;
revoke execute on function public.fn_claim_notification_emails(integer) from authenticated;
revoke execute on function public.fn_record_notification_email_result(uuid, text) from authenticated;
