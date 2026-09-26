-- Pedido de acesso mostrava o papel cru do enum ("proprietario"). Usa o
-- mesmo rótulo das telas (src/lib/permissions.js ROLES).
CREATE OR REPLACE FUNCTION public.fn_request_access(p_route text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    format('%s (%s) pediu acesso à tela %s', coalesce(nullif(v_name, ''), 'Um usuário'), case public.auth_role() when 'vendedor' then 'Vendedor' when 'estoquista' then 'Gestor de Estoque' when 'financeiro' then 'Gestor Financeiro' when 'proprietario' then 'Proprietário' else 'sem perfil' end, v_route),
    'user', auth.uid()
  );
end;
$function$
;
