-- 20261005140000 recriou notifications_update achando que ela existia, mas
-- 20260928100000_audit_hardening já tinha tirado de propósito: marcar como
-- lido é só via fn_mark_notifications_read (authenticated nem tem UPDATE na
-- tabela). Volta ao estado intencional.
drop policy if exists notifications_update on public.notifications;
