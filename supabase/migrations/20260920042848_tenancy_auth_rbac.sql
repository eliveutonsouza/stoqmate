-- Fase 1 — tenancy, auth, RBAC.
--
-- Modelo: 1 usuário = 1 tenant (rede) pra vida toda; troca de loja dentro do
-- tenant é seleção de contexto na UI, não troca de sessão. role_area_access
-- é o port literal de AREAS/ROLES/ACCESS de src/lib/permissions.js — quando
-- aquele arquivo mudar, esta tabela muda junto, mesmo commit.

create extension if not exists pgcrypto;

-- ============================================================
-- Enums
-- ============================================================

create type public.store_role as enum ('vendedor', 'estoquista', 'financeiro', 'proprietario');
create type public.platform_role as enum ('super_admin', 'suporte', 'engenharia', 'comercial');
create type public.membership_status as enum ('active', 'invited');
create type public.store_type as enum ('loja', 'cd', 'quiosque', 'estoque_externo');
create type public.tenant_status as enum ('trial', 'active', 'past_due', 'canceled');

-- ============================================================
-- Core tenancy
-- ============================================================

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subdomain text not null unique,
  cnpj text,
  plan_id text not null default 'balcao',
  status public.tenant_status not null default 'trial',
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  type public.store_type not null default 'loja',
  city text,
  address jsonb,
  cnpj text,
  timezone text not null default 'America/Sao_Paulo',
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create index stores_tenant_id_idx on public.stores (tenant_id);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete set null,
  full_name text,
  initials text,
  phone text,
  created_at timestamptz not null default now()
);

create table public.store_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.store_role not null,
  status public.membership_status not null default 'active',
  invited_at timestamptz,
  joined_at timestamptz default now(),
  unique (tenant_id, user_id)
);
create index store_users_user_id_idx on public.store_users (user_id);
create index store_users_tenant_id_idx on public.store_users (tenant_id);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role public.store_role not null,
  token uuid not null default gen_random_uuid() unique,
  invited_by uuid references auth.users(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, email)
);

create table public.platform_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.platform_role not null,
  mfa_required boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RBAC — mirror literal de src/lib/permissions.js (AREAS/ROLES/ACCESS)
-- access: 0 none, 1 view, 2 edit, 3 full — mesma escala de ACCESS no JS.
-- ============================================================

create table public.role_area_access (
  role public.store_role not null,
  area text not null,
  access smallint not null check (access between 0 and 3),
  primary key (role, area)
);

insert into public.role_area_access (role, area, access) values
  ('vendedor', 'account', 2), ('estoquista', 'account', 2), ('financeiro', 'account', 2), ('proprietario', 'account', 3),
  ('vendedor', 'pos', 2), ('estoquista', 'pos', 2), ('financeiro', 'pos', 1), ('proprietario', 'pos', 3),
  ('vendedor', 'catalog', 1), ('estoquista', 'catalog', 2), ('financeiro', 'catalog', 1), ('proprietario', 'catalog', 3),
  ('vendedor', 'stock', 1), ('estoquista', 'stock', 2), ('financeiro', 'stock', 1), ('proprietario', 'stock', 3),
  ('vendedor', 'purchasing', 0), ('estoquista', 'purchasing', 2), ('financeiro', 'purchasing', 1), ('proprietario', 'purchasing', 3),
  ('vendedor', 'promos', 1), ('estoquista', 'promos', 2), ('financeiro', 'promos', 2), ('proprietario', 'promos', 3),
  ('vendedor', 'ai', 0), ('estoquista', 'ai', 2), ('financeiro', 'ai', 1), ('proprietario', 'ai', 3),
  ('vendedor', 'reports', 1), ('estoquista', 'reports', 1), ('financeiro', 'reports', 1), ('proprietario', 'reports', 3),
  ('vendedor', 'money', 0), ('estoquista', 'money', 1), ('financeiro', 'money', 2), ('proprietario', 'money', 3),
  ('vendedor', 'network', 0), ('estoquista', 'network', 1), ('financeiro', 'network', 1), ('proprietario', 'network', 3),
  ('vendedor', 'fiscal', 0), ('estoquista', 'fiscal', 0), ('financeiro', 'fiscal', 2), ('proprietario', 'fiscal', 3),
  ('vendedor', 'billing', 0), ('estoquista', 'billing', 0), ('financeiro', 'billing', 2), ('proprietario', 'billing', 3),
  ('vendedor', 'company', 0), ('estoquista', 'company', 1), ('financeiro', 'company', 2), ('proprietario', 'company', 3),
  ('vendedor', 'people', 0), ('estoquista', 'people', 0), ('financeiro', 'people', 0), ('proprietario', 'people', 3);

-- ============================================================
-- Funções de autorização — chamadas por toda policy de RLS daqui pra frente
-- ============================================================

create or replace function public.auth_tenant_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

create or replace function public.auth_role()
returns public.store_role
language sql stable security definer
set search_path = public
as $$
  select role from public.store_users
  where user_id = auth.uid() and tenant_id = public.auth_tenant_id()
$$;

-- has_access('catalog', 2) == can(role, route, 'edit') no client.
create or replace function public.has_access(p_area text, p_min_level integer default 1)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (select raa.access >= p_min_level
     from public.role_area_access raa
     where raa.role = public.auth_role() and raa.area = p_area),
    false
  )
$$;

create or replace function public.is_platform_staff()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.platform_staff where user_id = auth.uid())
$$;

-- ============================================================
-- Signup / invite — únicas portas de entrada pra criar tenant/membership.
-- security definer: um usuário recém-autenticado ainda não tem tenant, então
-- nenhuma policy de RLS liberaria os inserts abaixo por si só.
-- ============================================================

create or replace function public.fn_complete_signup(
  p_full_name text,
  p_store_name text,
  p_subdomain text,
  p_cnpj text default null,
  p_plan_id text default 'balcao'
)
returns table (tenant_id uuid, store_id uuid)
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_store_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid() and tenant_id is not null) then
    raise exception 'user already has a tenant';
  end if;

  insert into public.tenants (name, subdomain, cnpj, plan_id)
  values (p_store_name, p_subdomain, p_cnpj, p_plan_id)
  returning id into v_tenant_id;

  insert into public.stores (tenant_id, name, type)
  values (v_tenant_id, p_store_name, 'loja')
  returning id into v_store_id;

  insert into public.profiles (id, tenant_id, full_name)
  values (auth.uid(), v_tenant_id, p_full_name)
  on conflict (id) do update set tenant_id = excluded.tenant_id, full_name = excluded.full_name;

  insert into public.store_users (tenant_id, user_id, role, status)
  values (v_tenant_id, auth.uid(), 'proprietario', 'active');

  return query select v_tenant_id, v_store_id;
end;
$$;

create or replace function public.fn_accept_invite(p_token uuid, p_full_name text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_invite public.invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_invite from public.invites
  where token = p_token and accepted_at is null and expires_at > now();

  if not found then
    raise exception 'invite invalid or expired';
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
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table public.tenants enable row level security;
alter table public.stores enable row level security;
alter table public.profiles enable row level security;
alter table public.store_users enable row level security;
alter table public.invites enable row level security;
alter table public.platform_staff enable row level security;
alter table public.role_area_access enable row level security;

-- tenants: só lê o próprio; nenhum insert/update/delete direto (só via
-- fn_complete_signup, que roda security definer e ignora RLS).
create policy tenants_select_own on public.tenants
  for select to authenticated
  using (id = public.auth_tenant_id());

-- stores: qualquer membro do tenant lê (seletor de loja precisa disso pra
-- todo perfil); só quem tem 'people' full gerencia (criar/editar unidade).
create policy stores_select on public.stores
  for select to authenticated
  using (tenant_id = public.auth_tenant_id());
create policy stores_write on public.stores
  for all to authenticated
  using (tenant_id = public.auth_tenant_id() and public.has_access('people', 3))
  with check (tenant_id = public.auth_tenant_id() and public.has_access('people', 3));

-- profiles: sempre a própria linha; colegas do tenant só com 'people' view+.
create policy profiles_select_self on public.profiles
  for select to authenticated
  using (id = auth.uid());
create policy profiles_select_tenant on public.profiles
  for select to authenticated
  using (tenant_id = public.auth_tenant_id() and public.has_access('people', 1));
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- store_users: ver equipe exige 'people' view+; gerenciar (mudar role,
-- remover) exige 'people' full — só o Proprietário, como o próprio
-- permissions.js documenta.
create policy store_users_select on public.store_users
  for select to authenticated
  using (tenant_id = public.auth_tenant_id() and public.has_access('people', 1));
create policy store_users_write on public.store_users
  for all to authenticated
  using (tenant_id = public.auth_tenant_id() and public.has_access('people', 3))
  with check (tenant_id = public.auth_tenant_id() and public.has_access('people', 3));

-- invites: geridos só por quem tem 'people' full. O aceite de convite não
-- lê esta tabela direto — passa por fn_accept_invite (security definer).
create policy invites_manage on public.invites
  for all to authenticated
  using (tenant_id = public.auth_tenant_id() and public.has_access('people', 3))
  with check (tenant_id = public.auth_tenant_id() and public.has_access('people', 3));

-- platform_staff: sem policy nenhuma além do RLS ligado = nega tudo pro
-- client. Só a função is_platform_staff() (security definer) e o backend
-- com service_role enxergam esta tabela.

-- role_area_access: dado de configuração, seguro pra qualquer autenticado
-- ler (é o mesmo dado já público no bundle JS); nunca editável pelo client.
create policy role_area_access_select on public.role_area_access
  for select to authenticated
  using (true);

-- ============================================================
-- Grants — RLS restringe linhas, os grants abaixo liberam a operação em si.
-- ============================================================

grant usage on schema public to authenticated;
grant select on public.tenants, public.stores, public.profiles, public.store_users, public.role_area_access to authenticated;
grant insert, update, delete on public.stores, public.store_users, public.invites to authenticated;
grant update on public.profiles to authenticated;
grant select, insert, update, delete on public.invites to authenticated;
grant execute on function public.fn_complete_signup(text, text, text, text, text) to authenticated;
grant execute on function public.fn_accept_invite(uuid, text) to authenticated;
grant execute on function public.has_access(text, integer) to authenticated;
grant execute on function public.auth_tenant_id() to authenticated;
grant execute on function public.auth_role() to authenticated;
grant execute on function public.is_platform_staff() to authenticated;
