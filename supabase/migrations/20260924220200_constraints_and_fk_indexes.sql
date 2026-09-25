-- Constraints de domínio que o código assumia mas o banco não garantia, e
-- índices nas FKs / colunas de filtro que o RLS e os relatórios usam.
-- Dados existentes conferidos antes (0 violações), então os checks entram
-- validados.

alter table public.products
  add constraint products_prices_non_negative check (sale_price >= 0 and cost_price >= 0);

alter table public.sale_items
  add constraint sale_items_qty_positive check (qty > 0),
  add constraint sale_items_discount_range check (discount_pct between 0 and 100),
  add constraint sale_items_unit_price_non_negative check (unit_price >= 0);

alter table public.sales
  add constraint sales_total_non_negative check (total >= 0);

alter table public.stock_balances
  add constraint stock_balances_qty_non_negative check (qty >= 0);

alter table public.customers
  add constraint customers_credit_non_negative check (credit_balance >= 0);

create index if not exists profiles_tenant_id_idx on public.profiles (tenant_id);
create index if not exists sales_tenant_created_idx on public.sales (tenant_id, created_at desc);
create index if not exists sales_customer_id_idx on public.sales (customer_id);
create index if not exists sale_items_product_id_idx on public.sale_items (product_id);
create index if not exists stock_movements_tenant_created_idx on public.stock_movements (tenant_id, created_at desc);
create index if not exists transfers_origin_store_idx on public.transfers (origin_store_id);
create index if not exists transfers_destination_store_idx on public.transfers (destination_store_id);
create index if not exists transfer_items_product_id_idx on public.transfer_items (product_id);
create index if not exists stock_counts_store_id_idx on public.stock_counts (store_id);
create index if not exists stock_count_items_product_id_idx on public.stock_count_items (product_id);
create index if not exists products_supplier_id_idx on public.products (supplier_id);
create index if not exists products_default_location_idx on public.products (default_location_id);
create index if not exists supplier_categories_category_idx on public.supplier_categories (category_id);
create index if not exists location_categories_category_idx on public.location_categories (category_id);
create index if not exists purchase_orders_supplier_idx on public.purchase_orders (supplier_id);
create index if not exists purchase_order_items_product_idx on public.purchase_order_items (product_id);
create index if not exists promotions_product_idx on public.promotions (product_id);
create index if not exists promotions_category_idx on public.promotions (category_id);
create index if not exists customer_credit_ledger_tenant_idx on public.customer_credit_ledger (tenant_id);
create index if not exists impersonation_sessions_staff_idx on public.impersonation_sessions (staff_user_id);
