-- "Pedir acesso" em /access-denied vira notificação real pra rede (a
-- tabela só recebia insert de fn_notify_low_stock). Sem dependência de
-- email: quem administra a rede vê em /notifications. Um pedido pendente
-- (não lido) por usuário e rota — clicar de novo não gera spam.
create function public.fn_request_access(p_route text)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_name text;
  v_route text;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null then
    raise exception 'not authorized';
  end if;
  v_route := left(coalesce(nullif(trim(p_route), ''), '/'), 200);

  if exists (
    select 1 from public.notifications
    where tenant_id = v_tenant_id and kind = 'access_request' and target_id = auth.uid()
      and read_at is null and right(message, length(v_route) + 1) = ' ' || v_route
  ) then
    return;
  end if;

  select full_name into v_name from public.profiles where id = auth.uid();

  insert into public.notifications (tenant_id, kind, title, message, target_type, target_id)
  values (
    v_tenant_id, 'access_request', 'Pedido de acesso',
    format('%s (%s) pediu acesso à tela %s', coalesce(nullif(v_name, ''), 'Um usuário'), coalesce(public.auth_role()::text, 'sem perfil'), v_route),
    'user', auth.uid()
  );
end;
$$;
grant execute on function public.fn_request_access(text) to authenticated;
