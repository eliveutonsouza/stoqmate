-- Preview de convite pra tela /invite: alguém clicando o link ainda não tem
-- sessão nenhuma, então precisa de uma função pública (security definer) que
-- exponha só o mínimo (email/role/nome do tenant) de um convite válido — a
-- tabela invites em si continua travada por RLS (só people/full).

create or replace function public.fn_invite_preview(p_token uuid)
returns table (email text, role public.store_role, tenant_name text)
language sql stable security definer
set search_path = public
as $$
  select i.email, i.role, t.name
  from public.invites i
  join public.tenants t on t.id = i.tenant_id
  where i.token = p_token and i.accepted_at is null and i.expires_at > now()
$$;

grant execute on function public.fn_invite_preview(uuid) to authenticated, anon;
