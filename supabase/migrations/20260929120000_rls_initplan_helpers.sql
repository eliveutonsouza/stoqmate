-- Performance de RLS: helpers de sessão avaliados uma vez por query, não
-- por linha.
--
-- As policies escritas como `tenant_id = public.auth_tenant_id() and
-- public.has_access('x', n)` fazem o Postgres chamar as funções (que por sua
-- vez consultam profiles/role_area_access) para CADA linha lida. Envolvidas
-- em `(select …)` viram InitPlan: calculadas uma vez e reusadas. Padrão
-- recomendado pelo Supabase (lint auth_rls_initplan); já usado em
-- 20260926100100_sale_promotions_discount_approval.sql.
--
-- A semântica não muda: as funções são STABLE e sem argumento de linha
-- (has_access só é envolvido quando os argumentos são literais). Em vez de
-- reescrever ~50 policies à mão (e arriscar divergir do que está no banco),
-- a reescrita parte da expressão real em pg_policies e aplica ALTER POLICY
-- — nome, comando, roles e permissividade ficam intactos. Idempotente: o
-- que já está dentro de SELECT não é tocado.

create or replace function pg_temp.wrap_rls_helpers(expr text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    regexp_replace(
      expr,
      '(?<!SELECT )\m(auth_tenant_id|auth_role|is_platform_staff)\(\)',
      '(SELECT public.\1())',
      'g'
    ),
    '(?<!SELECT )\mhas_access\((''[^'']*''::text), (\d+)\)',
    '(SELECT public.has_access(\1, \2))',
    'g'
  );
$$;

do $$
declare
  r record;
  new_qual text;
  new_check text;
begin
  for r in
    select tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
  loop
    new_qual := pg_temp.wrap_rls_helpers(r.qual);
    new_check := pg_temp.wrap_rls_helpers(r.with_check);

    if new_qual is distinct from r.qual then
      execute format('alter policy %I on public.%I using (%s)', r.policyname, r.tablename, new_qual);
    end if;
    if new_check is distinct from r.with_check then
      execute format('alter policy %I on public.%I with check (%s)', r.policyname, r.tablename, new_check);
    end if;
  end loop;
end
$$;
