-- Fase D — checkout de pagamento único do Stripe pro pacote de crédito
-- avulso (última função de créditos que ainda era só decoração na tela
-- settings/credits).

create table public.credit_packs (
  id text primary key,
  credits integer not null,
  price numeric(12, 2) not null,
  stripe_price_id text,
  active boolean not null default true
);
insert into public.credit_packs (id, credits, price) values
  ('pack_250', 250, 29),
  ('pack_500', 500, 49),
  ('pack_1500', 1500, 129);

alter table public.credit_packs enable row level security;
create policy credit_packs_select_active on public.credit_packs
  for select to authenticated using (active);

-- Idempotência contra reentrega do webhook: só credita se a linha for
-- realmente inserida (unique em stripe_checkout_session_id).
create table public.credit_pack_purchases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  pack_id text not null references public.credit_packs(id),
  stripe_checkout_session_id text not null unique,
  credits integer not null,
  created_at timestamptz not null default now()
);
create index credit_pack_purchases_tenant_id_idx on public.credit_pack_purchases (tenant_id);

alter table public.credit_pack_purchases enable row level security;
create policy credit_pack_purchases_select_own on public.credit_pack_purchases
  for select to authenticated using (tenant_id = public.auth_tenant_id());
grant select on public.credit_pack_purchases to authenticated;

-- fn_ai_credit_pack_purchase — chamada só pelo webhook do Stripe
-- (service_role), nunca por authenticated: recebe tenant_id explícito.
create function public.fn_ai_credit_pack_purchase(
  p_tenant_id uuid, p_pack_id text, p_stripe_checkout_session_id text
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_credits integer;
  v_row_count integer;
  v_extra integer;
begin
  select credits into v_credits from public.credit_packs where id = p_pack_id;
  if v_credits is null then
    raise exception 'pacote de crédito inválido';
  end if;

  insert into public.credit_pack_purchases (tenant_id, pack_id, stripe_checkout_session_id, credits)
  values (p_tenant_id, p_pack_id, p_stripe_checkout_session_id, v_credits)
  on conflict (stripe_checkout_session_id) do nothing;
  get diagnostics v_row_count = row_count;

  if v_row_count > 0 then
    update public.tenants set ai_credit_extra_balance = ai_credit_extra_balance + v_credits where id = p_tenant_id
    returning ai_credit_extra_balance into v_extra;
    insert into public.ai_credit_ledger (tenant_id, delta, balance_after, reason)
    values (p_tenant_id, v_credits, v_extra, 'Compra de pacote avulso: ' || p_pack_id);
  end if;
end;
$$;
grant execute on function public.fn_ai_credit_pack_purchase(uuid, text, text) to service_role;
