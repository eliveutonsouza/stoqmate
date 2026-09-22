-- ============================================================
-- fn_update_fiscal_mode — /settings/fiscal saía do mock com uma tela
-- inteira de integração com emissor de nota que não existe no produto
-- (nenhuma venda chama API fiscal nenhuma hoje). Reduzido à única coisa
-- real: a escolha feita no onboarding (fn_complete_onboarding) pode ser
-- revista aqui, sem fingir emissão que não acontece.
-- ============================================================

create function public.fn_update_fiscal_mode(p_mode text)
returns void
language plpgsql security definer
set search_path = public
as $$
declare v_tenant_id uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('fiscal', 2) then
    raise exception 'not authorized';
  end if;
  if p_mode not in ('now', 'own', 'later') then
    raise exception 'modo fiscal inválido';
  end if;

  update public.tenants set fiscal_mode = p_mode where id = v_tenant_id;
end;
$$;

grant execute on function public.fn_update_fiscal_mode(text) to authenticated;
