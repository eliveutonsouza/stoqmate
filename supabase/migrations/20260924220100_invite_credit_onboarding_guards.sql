-- Autorização/integridade em funções que aceitavam entrada sem limite.
-- fn_customer_credit_adjust: trava a linha, delta != 0 e limitado, saldo de
--   crédito nunca fica negativo.
-- fn_accept_invite: convite só vale pro e-mail convidado e não move usuário
--   que já pertence a outra empresa.
-- fn_complete_onboarding: renomeia só a loja criada no cadastro.

CREATE OR REPLACE FUNCTION public.fn_customer_credit_adjust(p_customer_id uuid, p_delta numeric, p_reason text)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_tenant_id uuid;
  v_before numeric;
  v_after numeric;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null or not public.has_access('pos', 2) then
    raise exception 'not authorized';
  end if;
  if length(coalesce(p_reason, '')) = 0 then
    raise exception 'informe o motivo do ajuste';
  end if;

  if p_delta is null or p_delta = 0 or abs(p_delta) > 100000 then
    raise exception 'valor de ajuste inválido';
  end if;

  select credit_balance into v_before from public.customers where id = p_customer_id and tenant_id = v_tenant_id for update;
  if not found then
    raise exception 'cliente não encontrado';
  end if;
  v_after := v_before + p_delta;
  if v_after < 0 then
    raise exception 'crédito insuficiente';
  end if;

  update public.customers set credit_balance = v_after where id = p_customer_id;

  insert into public.customer_credit_ledger (tenant_id, customer_id, delta, balance_after, reason, created_by)
  values (v_tenant_id, p_customer_id, p_delta, v_after, p_reason, auth.uid());

  return v_after;
end;
$function$;

CREATE OR REPLACE FUNCTION public.fn_accept_invite(p_token uuid, p_full_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_invite public.invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_invite from public.invites
  where token = p_token and accepted_at is null and expires_at > now()
  for update;

  if not found then
    raise exception 'invite invalid or expired';
  end if;
  if lower(coalesce(v_invite.email, '')) <> lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'convite emitido para outro e-mail';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid() and tenant_id is not null and tenant_id <> v_invite.tenant_id) then
    raise exception 'usuário já pertence a outra empresa';
  end if;

  insert into public.profiles (id, tenant_id, full_name)
  values (auth.uid(), v_invite.tenant_id, p_full_name)
  on conflict (id) do update set tenant_id = excluded.tenant_id, full_name = excluded.full_name;

  insert into public.store_users (tenant_id, user_id, role, status)
  values (v_invite.tenant_id, auth.uid(), v_invite.role, 'active')
  on conflict (tenant_id, user_id) do update set role = excluded.role, status = 'active';

  update public.invites set accepted_at = now() where id = v_invite.id;

  return v_invite.tenant_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.fn_complete_onboarding(p_store_name text, p_logo_url text, p_brand_color text, p_fiscal_mode text, p_categories jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- só a loja criada no cadastro; nunca renomeia as demais unidades
  update public.stores set name = p_store_name
  where id = (select id from public.stores where tenant_id = v_tenant_id order by created_at limit 1);

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
$function$;
