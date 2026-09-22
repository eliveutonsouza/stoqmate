-- ============================================================
-- /settings/store-data saía do mock inteiro. Reduzido aos campos com
-- coluna real (name, cnpj) — razão social/IE/endereço/preferências de
-- operação do mock não têm coluna e foram cortados, não fingidos.
-- "Excluir conta" vira soft-delete real (status='canceled' +
-- canceled_at) — a purga definitiva dos dados depois de 90 dias
-- continua um processo manual da equipe, não um cron automatizado;
-- a UI não promete o que o produto não faz sozinho ainda.
-- ============================================================

alter table public.tenants add column canceled_at timestamptz;

create function public.fn_update_company_data(p_name text, p_cnpj text)
returns void
language plpgsql security definer
set search_path = public
as $$
declare v_tenant_id uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('company', 2) then
    raise exception 'not authorized';
  end if;
  if length(trim(p_name)) < 2 then
    raise exception 'nome muito curto';
  end if;
  update public.tenants set name = p_name, cnpj = nullif(p_cnpj, '') where id = v_tenant_id;
end;
$$;

grant execute on function public.fn_update_company_data(text, text) to authenticated;

create function public.fn_request_account_deletion()
returns void
language plpgsql security definer
set search_path = public
as $$
declare v_tenant_id uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('company', 3) then
    raise exception 'not authorized';
  end if;
  update public.tenants set status = 'canceled', canceled_at = now() where id = v_tenant_id;
  perform public.fn_write_audit('account.cancel_requested', 'Cancelamento da conta solicitado pelo proprietário', 'tenant', v_tenant_id);
end;
$$;

grant execute on function public.fn_request_account_deletion() to authenticated;
