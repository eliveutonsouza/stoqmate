-- Ferramenta de uma vez (ver 20260920140400_rls_audit_helper.sql) —
-- auditoria concluída, achou e corrigiu 2 gaps (ai_ops, platform_staff).
-- Não é schema permanente, sai do banco.
drop function public.fn_audit_rls_gaps();
