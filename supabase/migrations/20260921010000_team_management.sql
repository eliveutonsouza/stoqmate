-- ============================================================
-- Gestão de equipe do lojista — /settings/users saindo do mock.
--
-- Por que RPC e não query direta: o email do membro mora em auth.users, e
-- `profiles` não o duplica. Ler auth.users do client exigiria service_role,
-- que `.spec/architecture.md` proíbe fora de features/admin. Função
-- `security definer` resolve sem abrir essa exceção e é o padrão já usado
-- aqui (fn_platform_*).
--
-- Só 'proprietario' tem people > 0 (role_area_access), então na prática só
-- o dono gerencia equipe. A checagem usa has_access, não o nome do perfil,
-- pra continuar valendo se a matriz mudar.
-- ============================================================

create or replace function public.fn_team_members()
returns table (
  user_id uuid, full_name text, initials text, email text,
  role public.store_role, status public.membership_status,
  joined_at timestamptz, last_sign_in_at timestamptz
)
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
  select su.user_id, p.full_name, p.initials, u.email::text,
         su.role, su.status, su.joined_at, u.last_sign_in_at
  from public.store_users su
  join auth.users u on u.id = su.user_id
  left join public.profiles p on p.id = su.user_id
  where su.tenant_id = v_tenant_id
  order by su.role desc, p.full_name nulls last;
end;
$$;

create or replace function public.fn_team_pending_invites()
returns table (id uuid, email text, role public.store_role, token uuid, expires_at timestamptz)
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
  select i.id, i.email, i.role, i.token, i.expires_at
  from public.invites i
  where i.tenant_id = v_tenant_id and i.accepted_at is null and i.expires_at > now()
  order by i.created_at desc;
end;
$$;

-- Devolve o token pra tela montar o link de convite. Enquanto não há envio
-- de email configurado (ver TODO de domínio), o dono copia e manda à mão —
-- melhor que um botão que finge ter enviado.
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

  insert into public.invites (tenant_id, email, role, invited_by)
  values (v_tenant_id, p_email, p_role, auth.uid())
  on conflict (tenant_id, email) do update
    set role = excluded.role,
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

create or replace function public.fn_team_set_role(p_user_id uuid, p_role public.store_role)
returns void
language plpgsql security definer
set search_path = public
as $$
declare v_tenant_id uuid; v_current public.store_role;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('people', 3) then
    raise exception 'not authorized';
  end if;

  select role into v_current from public.store_users
  where tenant_id = v_tenant_id and user_id = p_user_id;
  if v_current is null then
    raise exception 'Pessoa não encontrada nesta rede.';
  end if;

  -- Rede sem nenhum proprietário fica sem quem conceda acesso — ninguém
  -- consegue reverter isso pela própria interface.
  if v_current = 'proprietario' and p_role <> 'proprietario'
     and (select count(*) from public.store_users
          where tenant_id = v_tenant_id and role = 'proprietario') <= 1 then
    raise exception 'A rede precisa de pelo menos um proprietário.';
  end if;

  update public.store_users set role = p_role
  where tenant_id = v_tenant_id and user_id = p_user_id;

  perform public.fn_write_audit('team.role_change', 'Perfil alterado para ' || p_role, 'user', p_user_id);
end;
$$;

create or replace function public.fn_team_remove(p_user_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare v_tenant_id uuid; v_current public.store_role;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('people', 3) then
    raise exception 'not authorized';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Você não pode remover a si mesmo.';
  end if;

  select role into v_current from public.store_users
  where tenant_id = v_tenant_id and user_id = p_user_id;
  if v_current is null then
    raise exception 'Pessoa não encontrada nesta rede.';
  end if;

  if v_current = 'proprietario'
     and (select count(*) from public.store_users
          where tenant_id = v_tenant_id and role = 'proprietario') <= 1 then
    raise exception 'A rede precisa de pelo menos um proprietário.';
  end if;

  delete from public.store_users where tenant_id = v_tenant_id and user_id = p_user_id;
  update public.profiles set tenant_id = null where id = p_user_id and tenant_id = v_tenant_id;

  perform public.fn_write_audit('team.remove', 'Acesso removido da rede', 'user', p_user_id);
end;
$$;

create or replace function public.fn_team_cancel_invite(p_invite_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare v_tenant_id uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('people', 3) then
    raise exception 'not authorized';
  end if;

  delete from public.invites where id = p_invite_id and tenant_id = v_tenant_id;
end;
$$;

grant execute on function public.fn_team_members() to authenticated;
grant execute on function public.fn_team_pending_invites() to authenticated;
grant execute on function public.fn_team_invite(text, text, public.store_role) to authenticated;
grant execute on function public.fn_team_set_role(uuid, public.store_role) to authenticated;
grant execute on function public.fn_team_remove(uuid) to authenticated;
grant execute on function public.fn_team_cancel_invite(uuid) to authenticated;
