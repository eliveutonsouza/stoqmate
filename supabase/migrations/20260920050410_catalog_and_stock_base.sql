-- Fase 2 — catálogo e estoque base.
--
-- Port do modelo hoje mockado em src/lib/mock.js (CATEGORIES),
-- src/lib/catalog.js (CATALOG), src/features/operations/{suppliers,locations}.jsx.
-- Nomes de coluna resolvidos pra tirar as inconsistências achadas no mock:
-- sempre cost_price/sale_price numéricos (nunca "cost"/"purchase"/string
-- formatada), sempre FK por id (nunca nome/código como chave).

create type public.category_attribute_type as enum ('color', 'size', 'spec');

-- ============================================================
-- categories + category_attributes (área: catalog)
-- ============================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  unit text not null default 'un',
  unit_plural text not null default 'un',
  code text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, code)
);
create index categories_tenant_id_idx on public.categories (tenant_id);

create table public.category_attributes (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  key text not null,
  label text not null,
  type public.category_attribute_type not null default 'spec',
  values text[] not null default '{}',
  position smallint not null default 0,
  unique (category_id, key)
);
create index category_attributes_category_id_idx on public.category_attributes (category_id);

-- ============================================================
-- suppliers (área: purchasing)
-- ============================================================

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  cnpj text,
  ie text,
  phone text,
  whatsapp text,
  order_email text,
  sales_rep text,
  address jsonb,
  brands text[] not null default '{}',
  lead_time_days smallint,
  min_order_value numeric(12, 2),
  payment_terms text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index suppliers_tenant_id_idx on public.suppliers (tenant_id);

create table public.supplier_categories (
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (supplier_id, category_id)
);

-- ============================================================
-- locations / shelves (área: stock)
-- ============================================================

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  code text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (store_id, code)
);
create index locations_tenant_id_idx on public.locations (tenant_id);
create index locations_store_id_idx on public.locations (store_id);

create table public.location_categories (
  location_id uuid not null references public.locations(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (location_id, category_id)
);

-- ============================================================
-- products (área: catalog) + stock_balances (área: stock, por loja)
-- ============================================================

create table public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  supplier_id uuid references public.suppliers(id),
  default_location_id uuid references public.locations(id),
  sku text not null,
  barcode text,
  brand text,
  name text not null,
  attrs jsonb not null default '{}',
  cost_price numeric(12, 2) not null default 0,
  sale_price numeric(12, 2) not null default 0,
  min_stock integer not null default 0,
  photo_url text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, sku)
);
create unique index products_tenant_barcode_key on public.products (tenant_id, barcode) where barcode is not null;
create index products_tenant_id_idx on public.products (tenant_id);
create index products_category_id_idx on public.products (category_id);

create table public.stock_balances (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  qty integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (product_id, store_id)
);
create index stock_balances_store_id_idx on public.stock_balances (store_id);

-- ============================================================
-- Storage: fotos de produto (bucket público — exibido direto por URL)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

-- Caminho esperado: {tenant_id}/{qualquer coisa} — a policy só confere o
-- primeiro segmento do path contra o tenant de quem está autenticado.
create policy product_photos_read on storage.objects
  for select to public
  using (bucket_id = 'product-photos');

create policy product_photos_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = public.auth_tenant_id()::text
    and public.has_access('catalog', 2)
  );

create policy product_photos_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = public.auth_tenant_id()::text
    and public.has_access('catalog', 2)
  );

create policy product_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = public.auth_tenant_id()::text
    and public.has_access('catalog', 2)
  );

-- ============================================================
-- RLS
-- ============================================================

alter table public.categories enable row level security;
alter table public.category_attributes enable row level security;
alter table public.suppliers enable row level security;
alter table public.supplier_categories enable row level security;
alter table public.locations enable row level security;
alter table public.location_categories enable row level security;
alter table public.products enable row level security;
alter table public.stock_balances enable row level security;

create policy categories_select on public.categories
  for select to authenticated using (tenant_id = public.auth_tenant_id() and public.has_access('catalog', 1));
create policy categories_write on public.categories
  for all to authenticated
  using (tenant_id = public.auth_tenant_id() and public.has_access('catalog', 2))
  with check (tenant_id = public.auth_tenant_id() and public.has_access('catalog', 2));

create policy category_attributes_select on public.category_attributes
  for select to authenticated
  using (exists (select 1 from public.categories c where c.id = category_id and c.tenant_id = public.auth_tenant_id() and public.has_access('catalog', 1)));
create policy category_attributes_write on public.category_attributes
  for all to authenticated
  using (exists (select 1 from public.categories c where c.id = category_id and c.tenant_id = public.auth_tenant_id() and public.has_access('catalog', 2)))
  with check (exists (select 1 from public.categories c where c.id = category_id and c.tenant_id = public.auth_tenant_id() and public.has_access('catalog', 2)));

create policy suppliers_select on public.suppliers
  for select to authenticated using (tenant_id = public.auth_tenant_id() and public.has_access('purchasing', 1));
create policy suppliers_write on public.suppliers
  for all to authenticated
  using (tenant_id = public.auth_tenant_id() and public.has_access('purchasing', 2))
  with check (tenant_id = public.auth_tenant_id() and public.has_access('purchasing', 2));

create policy supplier_categories_select on public.supplier_categories
  for select to authenticated
  using (exists (select 1 from public.suppliers s where s.id = supplier_id and s.tenant_id = public.auth_tenant_id() and public.has_access('purchasing', 1)));
create policy supplier_categories_write on public.supplier_categories
  for all to authenticated
  using (exists (select 1 from public.suppliers s where s.id = supplier_id and s.tenant_id = public.auth_tenant_id() and public.has_access('purchasing', 2)))
  with check (exists (select 1 from public.suppliers s where s.id = supplier_id and s.tenant_id = public.auth_tenant_id() and public.has_access('purchasing', 2)));

create policy locations_select on public.locations
  for select to authenticated using (tenant_id = public.auth_tenant_id() and public.has_access('stock', 1));
create policy locations_write on public.locations
  for all to authenticated
  using (tenant_id = public.auth_tenant_id() and public.has_access('stock', 2))
  with check (tenant_id = public.auth_tenant_id() and public.has_access('stock', 2));

create policy location_categories_select on public.location_categories
  for select to authenticated
  using (exists (select 1 from public.locations l where l.id = location_id and l.tenant_id = public.auth_tenant_id() and public.has_access('stock', 1)));
create policy location_categories_write on public.location_categories
  for all to authenticated
  using (exists (select 1 from public.locations l where l.id = location_id and l.tenant_id = public.auth_tenant_id() and public.has_access('stock', 2)))
  with check (exists (select 1 from public.locations l where l.id = location_id and l.tenant_id = public.auth_tenant_id() and public.has_access('stock', 2)));

create policy products_select on public.products
  for select to authenticated using (tenant_id = public.auth_tenant_id() and public.has_access('catalog', 1));
create policy products_write on public.products
  for all to authenticated
  using (tenant_id = public.auth_tenant_id() and public.has_access('catalog', 2))
  with check (tenant_id = public.auth_tenant_id() and public.has_access('catalog', 2));

create policy stock_balances_select on public.stock_balances
  for select to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.tenant_id = public.auth_tenant_id() and public.has_access('stock', 1)));
-- Sem policy de insert/update/delete direto: saldo de estoque só muda via
-- fn_* (Fase 3) chamadas security definer, nunca escrita solta do cliente.

grant select on public.categories, public.category_attributes, public.suppliers, public.supplier_categories,
  public.locations, public.location_categories, public.products, public.stock_balances to authenticated;
grant insert, update, delete on public.categories, public.category_attributes, public.suppliers,
  public.supplier_categories, public.locations, public.location_categories, public.products to authenticated;
