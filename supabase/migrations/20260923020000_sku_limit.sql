-- limits.skus do plano nunca era aplicado (usuários e lojas já eram, em
-- fn_team_invite/fn_create_store). Trigger em vez de checagem por RPC:
-- cobre cadastro (insert direto via RLS), importação em lote
-- (fn_bulk_import_products — a transação inteira aborta, sem importação
-- parcial) e qualquer caminho futuro. Só SKU ativo conta, então desativar
-- produto libera espaço — e reativar passa pela mesma checagem.
--
-- Mensagem fixa 'limit_reached:skus' pro app reconhecer e mandar pra
-- /limit-reached em vez de mostrar erro cru.
create function public.fn_enforce_sku_limit()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_used integer;
begin
  if not new.active then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.active then
    return new;
  end if;

  select (pl.limits->>'skus')::integer into v_limit
  from public.tenants t join public.plans pl on pl.id = t.plan_id
  where t.id = new.tenant_id;

  if v_limit is null then
    return new;
  end if;

  select count(*) into v_used from public.products where tenant_id = new.tenant_id and active;
  if v_used >= v_limit then
    raise exception 'limit_reached:skus';
  end if;
  return new;
end;
$$;

create trigger products_sku_limit
  before insert or update of active on public.products
  for each row execute function public.fn_enforce_sku_limit();
