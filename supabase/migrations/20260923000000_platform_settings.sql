-- Config global da plataforma editada em /admin/settings. Linha única
-- (id = true) em vez de key/value: são poucos campos, tipados, e o console
-- lê todos de uma vez.
--
-- audit_log não serve aqui (tenant_id é not null e isso não pertence a
-- tenant nenhum) — a linha guarda quem/quando mudou por último.
create table public.platform_settings (
  id boolean primary key default true check (id),
  trial_days integer not null default 14 check (trial_days between 1 and 90),
  ai_spend_ceiling_usd numeric(12, 2) not null default 2500 check (ai_spend_ceiling_usd >= 0),
  ai_alert_pct integer not null default 80 check (ai_alert_pct between 1 and 100),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
insert into public.platform_settings (id) values (true);

alter table public.platform_settings enable row level security;
create policy platform_settings_staff_select on public.platform_settings
  for select to authenticated using (public.is_platform_staff());
grant select on public.platform_settings to authenticated;

create function public.fn_platform_settings_update(
  p_trial_days integer, p_ai_spend_ceiling_usd numeric, p_ai_alert_pct integer
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_platform_staff() then
    raise exception 'not authorized';
  end if;
  update public.platform_settings set
    trial_days = p_trial_days,
    ai_spend_ceiling_usd = p_ai_spend_ceiling_usd,
    ai_alert_pct = p_ai_alert_pct,
    updated_by = auth.uid(),
    updated_at = now()
  where id;
end;
$$;
grant execute on function public.fn_platform_settings_update(integer, numeric, integer) to authenticated;

-- Usada no default de tenants.trial_ends_at: vale pra todo caminho que cria
-- tenant (signup por senha, Google, criação pelo console) sem redefinir
-- cada RPC. security definer porque quem insere o tenant não lê a tabela.
create function public.fn_platform_trial_days()
returns integer
language sql stable security definer
set search_path = public
as $$
  select coalesce((select trial_days from public.platform_settings where id), 14);
$$;

alter table public.tenants
  alter column trial_ends_at set default (now() + make_interval(days => public.fn_platform_trial_days()));
