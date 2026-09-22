-- ============================================================
-- Onboarding deixa de descartar o que a wizard coleta. Nome, logo, cor,
-- categorias e escolha fiscal iam pro void ao clicar "Concluir e entrar"
-- (nenhum arquivo em features/onboarding/ importava supabase). O mesmo
-- schema (logo_url/brand_color/fiscal_mode em tenants) é reaproveitado
-- depois por /settings/branding, /settings/store-data e /settings/fiscal
-- — nasce aqui uma vez só.
-- ============================================================

alter table public.tenants add column logo_url text;
alter table public.tenants add column brand_color text;
alter table public.tenants add column fiscal_mode text not null default 'later';

create function public.fn_complete_onboarding(
  p_store_name text, p_logo_url text, p_brand_color text, p_fiscal_mode text, p_categories jsonb
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_cat jsonb;
  v_attr jsonb;
  v_category_id uuid;
  v_pos smallint;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('company', 2) then
    raise exception 'not authorized';
  end if;
  if length(trim(p_store_name)) < 2 then
    raise exception 'nome da loja muito curto';
  end if;
  if p_fiscal_mode not in ('now', 'own', 'later') then
    raise exception 'modo fiscal inválido';
  end if;

  update public.tenants
  set name = p_store_name, logo_url = p_logo_url, brand_color = p_brand_color, fiscal_mode = p_fiscal_mode
  where id = v_tenant_id;

  update public.stores set name = p_store_name where tenant_id = v_tenant_id;

  for v_cat in select * from jsonb_array_elements(coalesce(p_categories, '[]'::jsonb))
  loop
    v_category_id := null;
    insert into public.categories (tenant_id, name, code, icon, color, unit, unit_plural)
    values (v_tenant_id, v_cat ->> 'name', upper(v_cat ->> 'code'), v_cat ->> 'icon', v_cat ->> 'color', v_cat ->> 'unit', v_cat ->> 'unit_plural')
    on conflict (tenant_id, code) do nothing
    returning id into v_category_id;

    if v_category_id is not null then
      v_pos := 0;
      for v_attr in select * from jsonb_array_elements(coalesce(v_cat -> 'attributes', '[]'::jsonb))
      loop
        insert into public.category_attributes (category_id, key, label, type, values, position)
        values (
          v_category_id, v_attr ->> 'key', v_attr ->> 'label', (v_attr ->> 'type')::public.category_attribute_type,
          (select coalesce(array_agg(value), '{}') from jsonb_array_elements_text(coalesce(v_attr -> 'values', '[]'::jsonb)) as value),
          v_pos
        );
        v_pos := v_pos + 1;
      end loop;
    end if;
  end loop;
end;
$$;

grant execute on function public.fn_complete_onboarding(text, text, text, text, jsonb) to authenticated;

-- ============================================================
-- Storage: logo da loja (bucket público, mesmo padrão de product-photos)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('store-branding', 'store-branding', true)
on conflict (id) do nothing;

create policy store_branding_read on storage.objects
  for select to public
  using (bucket_id = 'store-branding');

create policy store_branding_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'store-branding'
    and (storage.foldername(name))[1] = public.auth_tenant_id()::text
    and public.has_access('company', 2)
  );

create policy store_branding_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'store-branding'
    and (storage.foldername(name))[1] = public.auth_tenant_id()::text
    and public.has_access('company', 2)
  );
