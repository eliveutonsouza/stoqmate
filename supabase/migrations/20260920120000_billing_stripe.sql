-- Fase 9 — cobrança via Stripe. Conta de teste já existe (chave sk_test do
-- desenvolvedor) — Products/Prices dos 3 planos foram criados via API antes
-- desta migration; os IDs reais entram no seed abaixo. Nada aqui depende de
-- livemode — quando a conta de produção existir, é só trocar as chaves nos
-- secrets do Supabase/Vercel, o schema não muda.

alter table public.plans
  add column stripe_product_id text,
  add column stripe_price_monthly_id text,
  add column stripe_price_yearly_id text;

update public.plans set stripe_product_id = 'prod_VIONd7rO3Lhpsg', stripe_price_monthly_id = 'price_1UHnbRLFGiiWxraqd3M30epE', stripe_price_yearly_id = 'price_1UHnbULFGiiWxraqf9O4AWpl' where id = 'balcao';
update public.plans set stripe_product_id = 'prod_VIONqmZ6JjYB8S', stripe_price_monthly_id = 'price_1UHnbXLFGiiWxraqDTxTDmAb', stripe_price_yearly_id = 'price_1UHnbaLFGiiWxraq7LVXAQuq' where id = 'controle';
update public.plans set stripe_product_id = 'prod_VIOOrND1hxUUHO', stripe_price_monthly_id = 'price_1UHnbdLFGiiWxraq8Ju7NIje', stripe_price_yearly_id = 'price_1UHnbgLFGiiWxraquuHeixvV' where id = 'rede';

create table public.billing_customers (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);

create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid');

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  stripe_subscription_id text not null unique,
  plan_id text references public.plans(id),
  cycle text not null default 'monthly',
  status public.subscription_status not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_tenant_id_idx on public.subscriptions (tenant_id);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  stripe_invoice_id text not null unique,
  amount_paid numeric(12, 2) not null default 0,
  currency text not null default 'brl',
  status text not null,
  hosted_invoice_url text,
  invoice_pdf text,
  period_end timestamptz,
  created_at timestamptz not null default now()
);
create index invoices_tenant_id_idx on public.invoices (tenant_id);

-- RLS: tenant vê o próprio faturamento (área "billing" já mapeada em
-- permissions.js), staff vê tudo (console de plataforma).
alter table public.billing_customers enable row level security;
create policy billing_customers_select on public.billing_customers
  for select to authenticated using (tenant_id = public.auth_tenant_id() and public.has_access('billing', 1));
create policy billing_customers_staff on public.billing_customers
  for select to authenticated using (public.is_platform_staff());
grant select on public.billing_customers to authenticated;

alter table public.subscriptions enable row level security;
create policy subscriptions_select on public.subscriptions
  for select to authenticated using (tenant_id = public.auth_tenant_id() and public.has_access('billing', 1));
create policy subscriptions_staff on public.subscriptions
  for select to authenticated using (public.is_platform_staff());
grant select on public.subscriptions to authenticated;

alter table public.invoices enable row level security;
create policy invoices_select on public.invoices
  for select to authenticated using (tenant_id = public.auth_tenant_id() and public.has_access('billing', 1));
create policy invoices_staff on public.invoices
  for select to authenticated using (public.is_platform_staff());
grant select on public.invoices to authenticated;

-- Nenhuma policy de insert/update: só o webhook (service_role, bypassa RLS)
-- e os Server Actions de checkout/portal (também service_role pra criar o
-- billing_customers na primeira cobrança) escrevem nessas tabelas.
