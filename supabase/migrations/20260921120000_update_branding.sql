create function public.fn_update_branding(p_logo_url text, p_brand_color text)
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
  update public.tenants set logo_url = p_logo_url, brand_color = p_brand_color where id = v_tenant_id;
end;
$$;

grant execute on function public.fn_update_branding(text, text) to authenticated;
