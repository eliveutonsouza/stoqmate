-- Auditoria de production readiness, rodada 2 (2026-10-05).
--
-- 1. Retenção pós-exclusão (LGPD + Termos/Política): conta cancelada ou com
--    exclusão pedida (soft-delete: status 'canceled' + canceled_at) é apagada
--    de vez depois de 90 dias. Antes a purga era manual e a política
--    prometia algo que o produto não fazia. Quem apaga é a Edge Function
--    tenant-retention (arquivos do Storage só saem pela API do Storage, e
--    logins pela Admin API do Auth), disparada pelo pg_cron diário.
--    tenant_purge_log guarda só ids e datas — o registro de que a exclusão
--    aconteceu, sem os dados que foram excluídos.
-- 2. Avisos de caixa (diferença) e pedidos de acesso eram lidos e marcados
--    como lidos por qualquer perfil — o vendedor que causou a diferença
--    apagava o alerta antes do dono ver. Agora só quem gere pessoas
--    (people 3) ou dinheiro (money 2).
-- 3. Fila de email marcava como enviado antes de enviar: Resend fora do ar
--    = aviso perdido. Agora até 3 tentativas com espera crescente; bloqueio
--    pela allowlist de teste não tenta de novo.

-- ---------------------------------------------------------------------
-- 1. Retenção
-- ---------------------------------------------------------------------
create table if not exists public.tenant_purge_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  canceled_at timestamptz,
  purged_at timestamptz not null default now(),
  users_removed integer not null default 0,
  error text
);
alter table public.tenant_purge_log enable row level security;
create policy tenant_purge_log_staff_select on public.tenant_purge_log
  for select to authenticated using ((select public.is_platform_staff()));
grant select on public.tenant_purge_log to authenticated;
grant select, insert on public.tenant_purge_log to service_role;

-- Prazo único, também citado na Política de privacidade e nos Termos.
create or replace function public.fn_retention_days()
returns integer
language sql immutable
as $$ select 90 $$;
revoke execute on function public.fn_retention_days() from public, anon;
grant execute on function public.fn_retention_days() to authenticated, service_role;

-- Redes vencidas + membros (sem staff da plataforma) pra Edge Function
-- limpar Storage e logins.
create or replace function public.fn_tenants_due_for_purge_svc(p_limit integer default 20)
returns table (tenant_id uuid, canceled_at timestamptz, member_ids uuid[])
language sql stable security definer
set search_path = public
as $$
  select t.id, t.canceled_at,
    coalesce((
      select array_agg(p.id) from public.profiles p
      where p.tenant_id = t.id
        and not exists (select 1 from public.platform_staff ps where ps.user_id = p.id)
    ), '{}')
  from public.tenants t
  where t.status = 'canceled'
    and t.canceled_at is not null
    and t.canceled_at < now() - make_interval(days => public.fn_retention_days())
  order by t.canceled_at
  limit least(greatest(coalesce(p_limit, 20), 1), 50)
$$;
revoke execute on function public.fn_tenants_due_for_purge_svc(integer) from public, anon, authenticated;
grant execute on function public.fn_tenants_due_for_purge_svc(integer) to service_role;

-- Apaga a rede (cascade em todas as tabelas de domínio). Reconfere o prazo
-- e o status: reativação no meio do caminho não perde dado.
create or replace function public.fn_purge_tenant_svc(p_tenant_id uuid, p_users_removed integer default 0)
returns boolean
language plpgsql security definer
set search_path = public
as $$
declare
  v_canceled_at timestamptz;
begin
  select canceled_at into v_canceled_at from public.tenants
    where id = p_tenant_id and status = 'canceled'
      and canceled_at < now() - make_interval(days => public.fn_retention_days())
    for update;
  if not found then
    return false;
  end if;
  delete from public.tenants where id = p_tenant_id;
  insert into public.tenant_purge_log (tenant_id, canceled_at, users_removed)
  values (p_tenant_id, v_canceled_at, coalesce(p_users_removed, 0));
  return true;
end;
$$;
revoke execute on function public.fn_purge_tenant_svc(uuid, integer) from public, anon, authenticated;
grant execute on function public.fn_purge_tenant_svc(uuid, integer) to service_role;

create or replace function public.fn_log_purge_error_svc(p_tenant_id uuid, p_error text)
returns void
language sql security definer
set search_path = public
as $$
  insert into public.tenant_purge_log (tenant_id, error) values (p_tenant_id, left(p_error, 500));
$$;
revoke execute on function public.fn_log_purge_error_svc(uuid, text) from public, anon, authenticated;
grant execute on function public.fn_log_purge_error_svc(uuid, text) to service_role;

-- Disparo diário. URL e segredo do cron ficam no Vault (fora do git); o
-- mesmo segredo vai em RETENTION_CRON_SECRET nos secrets das Edge Functions:
--   select vault.create_secret('<https://ref.supabase.co>', 'project_url');
--   select vault.create_secret('<segredo aleatório>', 'retention_cron_secret');
-- Sem os secrets o job só registra falha em cron.job_run_details.
create extension if not exists pg_net with schema extensions;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'tenant-retention-daily') then
    perform cron.unschedule('tenant-retention-daily');
  end if;
end
$$;

select cron.schedule(
  'tenant-retention-daily',
  '41 4 * * *',
  $cron$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/tenant-retention',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'retention_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $cron$
);

-- ---------------------------------------------------------------------
-- 2. Avisos sensíveis só pra quem gere pessoas ou dinheiro
-- ---------------------------------------------------------------------
create or replace function public.fn_can_see_notification(p_kind text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select p_kind not in ('cash_discrepancy', 'access_request')
    or public.has_access('people', 3)
    or public.has_access('money', 2)
$$;
revoke execute on function public.fn_can_see_notification(text) from public, anon;
grant execute on function public.fn_can_see_notification(text) to authenticated;

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select to authenticated
  using (tenant_id = (select public.auth_tenant_id()) and public.fn_can_see_notification(kind));

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update to authenticated
  using (tenant_id = (select public.auth_tenant_id()) and public.fn_can_see_notification(kind))
  with check (tenant_id = (select public.auth_tenant_id()) and public.fn_can_see_notification(kind));

create or replace function public.fn_mark_notifications_read(p_ids uuid[] default null)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null then
    raise exception 'not authorized';
  end if;
  update public.notifications
  set read_at = now()
  where tenant_id = v_tenant_id and read_at is null
    and public.fn_can_see_notification(kind)
    and (p_ids is null or id = any(p_ids));
end;
$$;

-- ---------------------------------------------------------------------
-- 3. Fila de email com retentativa
-- ---------------------------------------------------------------------
alter table public.notifications add column if not exists email_attempts integer not null default 0;

create or replace function public.fn_claim_notification_emails_svc(p_limit integer default 20)
returns table (id uuid, kind text, title text, message text, created_at timestamptz, recipients text[])
language plpgsql security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  return query
  with pending as (
    select n.id
    from public.notifications n
    join public.notification_preferences np
      on np.tenant_id = n.tenant_id
     and np.email
     and np.rule = case n.kind
       when 'out_of_stock' then 'low_stock'
       when 'low_stock' then 'below_min'
       when 'access_request' then 'access_request'
       when 'cash_discrepancy' then 'cash_discrepancy'
     end
    where n.created_at > now() - interval '24 hours'
      and (
        n.emailed_at is null
        -- Falhou: tenta de novo (até 3 vezes), esperando 5, 10 min…
        or (n.email_error is not null and n.email_attempts < 3
            and n.emailed_at < now() - make_interval(mins => 5 * n.email_attempts))
      )
    order by n.created_at
    limit least(greatest(coalesce(p_limit, 20), 1), 50)
    for update of n skip locked
  ),
  claimed as (
    update public.notifications n
      set emailed_at = now(), email_attempts = n.email_attempts + 1, email_error = null
    from pending where n.id = pending.id
    returning n.id, n.tenant_id, n.kind, n.title, n.message, n.created_at
  )
  select c.id, c.kind, c.title, c.message, c.created_at,
    coalesce((
      select array_agg(distinct u.email::text)
      from public.store_users su
      join auth.users u on u.id = su.user_id
      where su.tenant_id = c.tenant_id and su.role = 'proprietario' and su.status = 'active' and u.email is not null
    ), '{}')
  from claimed c;
end;
$$;

-- p_retry = false (ex.: bloqueado pela allowlist) encerra as tentativas.
drop function if exists public.fn_record_notification_email_result_svc(uuid, text);
create or replace function public.fn_record_notification_email_result_svc(p_id uuid, p_error text, p_retry boolean default true)
returns void
language sql security definer
set search_path = public
as $$
  update public.notifications
    set email_error = left(p_error, 500),
        email_attempts = case when p_retry then email_attempts else 3 end
    where id = p_id;
$$;
revoke execute on function public.fn_record_notification_email_result_svc(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.fn_record_notification_email_result_svc(uuid, text, boolean) to service_role;
