-- ============================================================
-- Ajustes na gestão de equipe, pós-aplicação de 20260921010000:
--
-- 1) A UI de convite coleta "Nome completo" (obrigatório) e manda pra
--    fn_team_invite, mas a função recebia p_full_name e descartava — não
--    havia coluna pra guardar. Adiciona a coluna e passa a usá-la, e
--    fn_team_pending_invites passa a devolver o nome pra tela exibir.
-- 2) fn_team_cancel_invite não gravava auditoria (as outras 3 mutações de
--    equipe gravam). Alinha por consistência.
--
-- 20260921010000 já foi aplicada em produção — por isso os ajustes entram
-- aqui, não editando o arquivo já aplicado.
-- ============================================================

alter table public.invites add column full_name text;

drop function public.fn_team_pending_invites();

create function public.fn_team_pending_invites()
returns table (id uuid, email text, full_name text, role public.store_role, token uuid, expires_at timestamptz)
language plpgsql stable security definer
set search_path = public
as $$
declare v_tenant_id uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('people', 1) then
    raise exception 'not authorized';
  end if;

  return query
  select i.id, i.email, i.full_name, i.role, i.token, i.expires_at
  from public.invites i
  where i.tenant_id = v_tenant_id and i.accepted_at is null and i.expires_at > now()
  order by i.created_at desc;
end;
$$;

grant execute on function public.fn_team_pending_invites() to authenticated;

create or replace function public.fn_team_invite(
  p_email text, p_full_name text, p_role public.store_role
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_limit integer;
  v_used integer;
  v_token uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('people', 3) then
    raise exception 'not authorized';
  end if;

  p_email := lower(trim(p_email));
  if p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'email inválido';
  end if;

  p_full_name := nullif(trim(p_full_name), '');

  if exists (
    select 1 from public.store_users su
    join auth.users u on u.id = su.user_id
    where su.tenant_id = v_tenant_id and lower(u.email) = p_email
  ) then
    raise exception 'Esta pessoa já faz parte da equipe.';
  end if;

  -- Assento ocupado conta membro ativo + convite em aberto: senão dava pra
  -- estourar o limite do plano disparando convites em lote.
  select coalesce((pl.limits->>'users')::integer, 0) into v_limit
  from public.tenants t join public.plans pl on pl.id = t.plan_id
  where t.id = v_tenant_id;

  select (select count(*) from public.store_users where tenant_id = v_tenant_id)
       + (select count(*) from public.invites
          where tenant_id = v_tenant_id and accepted_at is null and expires_at > now()
            and lower(email) <> p_email)
    into v_used;

  if v_limit > 0 and v_used >= v_limit then
    raise exception 'Seu plano permite % usuários. Faça upgrade para convidar mais.', v_limit;
  end if;

  insert into public.invites (tenant_id, email, full_name, role, invited_by)
  values (v_tenant_id, p_email, p_full_name, p_role, auth.uid())
  on conflict (tenant_id, email) do update
    set full_name = excluded.full_name,
        role = excluded.role,
        invited_by = excluded.invited_by,
        token = gen_random_uuid(),
        expires_at = now() + interval '7 days',
        accepted_at = null,
        created_at = now()
  returning token into v_token;

  perform public.fn_write_audit('team.invite', 'Convite enviado para ' || p_email, 'invite', null);
  return v_token;
end;
$$;

create or replace function public.fn_team_cancel_invite(p_invite_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare v_tenant_id uuid; v_email text;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('people', 3) then
    raise exception 'not authorized';
  end if;

  delete from public.invites where id = p_invite_id and tenant_id = v_tenant_id
  returning email into v_email;

  if v_email is null then
    raise exception 'Convite não encontrado nesta rede.';
  end if;

  perform public.fn_write_audit('team.cancel_invite', 'Convite cancelado para ' || v_email, 'invite', null);
end;
$$;
