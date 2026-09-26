-- Avisos por email (Resend). A fila é a própria tabela notifications:
-- emailed_at marca que o aviso já foi reivindicado pra envio (com ou sem
-- sucesso — email_error guarda o motivo), então nada é enviado duas vezes.
--
-- Regras de email (notification_preferences.rule) × kind do aviso:
--   low_stock        ← out_of_stock  (SKU chegou a zero)
--   below_min        ← low_stock     (SKU cruzou o mínimo)
--   access_request   ← access_request (alguém pediu acesso a uma tela)
-- Destinatários: proprietários ativos da rede (quem configura avisos).

alter table public.notifications
  add column if not exists emailed_at timestamptz,
  add column if not exists email_error text;

create index if not exists notifications_email_queue_idx
  on public.notifications (tenant_id, created_at) where emailed_at is null;

-- Reivindica até p_limit avisos pendentes da rede de quem chama (criados
-- nas últimas 24 h, com email ligado na regra) e devolve o conteúdo +
-- destinatários. O update com `for update skip locked` garante que duas
-- chamadas simultâneas nunca pegam o mesmo aviso. Aviso sem regra de email
-- ligada não é tocado; a janela de 24 h evita disparar histórico antigo
-- quando alguém liga a regra depois.
create or replace function public.fn_claim_notification_emails(p_limit integer default 20)
returns table (id uuid, kind text, title text, message text, created_at timestamptz, recipients text[])
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_tenant_id uuid;
begin
  v_tenant_id := public.auth_tenant_id();
  if v_tenant_id is null then
    raise exception 'not authorized';
  end if;

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
     end
    where n.tenant_id = v_tenant_id
      and n.emailed_at is null
      and n.created_at > now() - interval '24 hours'
    order by n.created_at
    limit least(greatest(coalesce(p_limit, 20), 1), 50)
    for update of n skip locked
  ),
  claimed as (
    update public.notifications n set emailed_at = now()
    from pending where n.id = pending.id
    returning n.id, n.kind, n.title, n.message, n.created_at
  )
  select c.id, c.kind, c.title, c.message, c.created_at,
    coalesce((
      select array_agg(distinct u.email::text)
      from public.store_users su
      join auth.users u on u.id = su.user_id
      where su.tenant_id = v_tenant_id and su.role = 'proprietario' and su.status = 'active' and u.email is not null
    ), '{}')
  from claimed c;
end;
$$;

-- Resultado do envio (erro ou bloqueio pela allowlist de teste).
create or replace function public.fn_record_notification_email_result(p_id uuid, p_error text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.notifications set email_error = left(p_error, 500)
  where id = p_id and tenant_id = public.auth_tenant_id();
$$;

revoke execute on function public.fn_claim_notification_emails(integer) from public, anon;
grant execute on function public.fn_claim_notification_emails(integer) to authenticated;
revoke execute on function public.fn_record_notification_email_result(uuid, text) from public, anon;
grant execute on function public.fn_record_notification_email_result(uuid, text) to authenticated;
