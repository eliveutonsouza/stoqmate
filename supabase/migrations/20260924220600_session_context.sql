-- Contexto de sessão que o proxy consulta em toda rota de loja, numa chamada
-- só: perfil (RBAC) e estado de acesso da assinatura.
--
-- access:
--   ok            assinatura ativa/trialing, ou trial ainda válido
--   past_due      Stripe tentando cobrar de novo — acesso segue, com aviso
--   unpaid        cobrança esgotou as tentativas — só telas de cobrança
--   trial_ended   trial venceu sem assinatura — só telas de cobrança
--   canceled      conta cancelada — só telas de cobrança
--   no_tenant     usuário logado sem empresa (cadastro incompleto)
-- A assinatura (espelho do Stripe) manda; tenants.status é o fallback.

create or replace function public.fn_session_context()
returns table (tenant_id uuid, role public.store_role, access text, trial_ends_at timestamptz)
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_tenant public.tenants%rowtype;
  v_sub_status public.subscription_status;
begin
  select t.* into v_tenant from public.tenants t where t.id = public.auth_tenant_id();
  if not found then
    return query select null::uuid, null::public.store_role, 'no_tenant'::text, null::timestamptz;
    return;
  end if;

  select s.status into v_sub_status from public.subscriptions s
    where s.tenant_id = v_tenant.id
    order by (s.status in ('active', 'trialing', 'past_due')) desc, s.updated_at desc nulls last
    limit 1;

  return query select
    v_tenant.id,
    (select su.role from public.store_users su where su.tenant_id = v_tenant.id and su.user_id = auth.uid() and su.status = 'active'),
    case
      when v_sub_status in ('active', 'trialing') then 'ok'
      when v_sub_status = 'past_due' then 'past_due'
      when v_sub_status = 'unpaid' then 'unpaid'
      when v_tenant.status = 'canceled' or v_sub_status = 'canceled' then 'canceled'
      when v_tenant.status = 'past_due' then 'past_due'
      when v_tenant.status = 'active' then 'ok'
      when v_tenant.trial_ends_at is not null and v_tenant.trial_ends_at < now() then 'trial_ended'
      else 'ok'
    end,
    v_tenant.trial_ends_at;
end;
$$;

revoke execute on function public.fn_session_context() from public, anon;
grant execute on function public.fn_session_context() to authenticated;
