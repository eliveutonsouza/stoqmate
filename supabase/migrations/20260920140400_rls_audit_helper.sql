-- Ferramenta de auditoria temporária — achei em ai_ops um padrão perigoso
-- (RLS ligado, grant concedido, mas ZERO policy = nega tudo silenciosamente,
-- sem erro nenhum pro client). Preciso conferir se alguma outra tabela do
-- projeto caiu na mesma armadilha antes de fechar essa rodada de bugs.
-- Função é dropada na migration seguinte assim que a auditoria terminar —
-- não é schema permanente, é ferramenta de uma vez.
create function public.fn_audit_rls_gaps()
returns table (table_name text, rls_enabled boolean, policy_count bigint, has_authenticated_grant boolean)
language sql
security definer
set search_path = public
as $$
  select
    c.relname::text,
    c.relrowsecurity,
    count(p.polname),
    exists (
      select 1 from information_schema.role_table_grants g
      where g.table_schema = 'public' and g.table_name = c.relname
        and g.grantee = 'authenticated' and g.privilege_type = 'SELECT'
    )
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  left join pg_policy p on p.polrelid = c.oid
  where n.nspname = 'public' and c.relkind = 'r'
  group by c.relname, c.relrowsecurity, c.oid
  order by c.relname;
$$;
grant execute on function public.fn_audit_rls_gaps() to service_role;
