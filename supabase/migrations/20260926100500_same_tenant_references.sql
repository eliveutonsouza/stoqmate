-- Referências cruzadas entre tenants. A RLS de products/supplier_categories/
-- location_categories confere o tenant da LINHA (ou do dono do vínculo), mas
-- não o do registro referenciado: um lojista que soubesse o uuid de uma
-- categoria de outra rede conseguia cadastrar produto nela ou vinculá-la a
-- um fornecedor (achado no teste de ataque da auditoria, 2026-09-26).
-- Trigger vale pra insert direto E pra funções security definer.

create or replace function public.fn_check_product_refs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.category_id is not null and not exists (select 1 from public.categories where id = new.category_id and tenant_id = new.tenant_id) then
    raise exception 'categoria inválida';
  end if;
  if new.supplier_id is not null and not exists (select 1 from public.suppliers where id = new.supplier_id and tenant_id = new.tenant_id) then
    raise exception 'fornecedor inválido';
  end if;
  if new.default_location_id is not null and not exists (select 1 from public.locations where id = new.default_location_id and tenant_id = new.tenant_id) then
    raise exception 'local inválido';
  end if;
  return new;
end;
$$;

drop trigger if exists products_same_tenant_refs on public.products;
create trigger products_same_tenant_refs
  before insert or update of category_id, supplier_id, default_location_id, tenant_id on public.products
  for each row execute function public.fn_check_product_refs();

create or replace function public.fn_check_category_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_tenant uuid;
begin
  if tg_table_name = 'supplier_categories' then
    select tenant_id into v_owner_tenant from public.suppliers where id = new.supplier_id;
  else
    select tenant_id into v_owner_tenant from public.locations where id = new.location_id;
  end if;
  if not exists (select 1 from public.categories where id = new.category_id and tenant_id = v_owner_tenant) then
    raise exception 'categoria inválida';
  end if;
  return new;
end;
$$;

drop trigger if exists supplier_categories_same_tenant on public.supplier_categories;
create trigger supplier_categories_same_tenant
  before insert or update on public.supplier_categories
  for each row execute function public.fn_check_category_link();

drop trigger if exists location_categories_same_tenant on public.location_categories;
create trigger location_categories_same_tenant
  before insert or update on public.location_categories
  for each row execute function public.fn_check_category_link();

revoke execute on function public.fn_check_product_refs() from public, anon, authenticated;
revoke execute on function public.fn_check_category_link() from public, anon, authenticated;
