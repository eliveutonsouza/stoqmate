-- Reaplica o fechamento das colunas de custo (ver 20260926120000). A
-- leitura foi reaberta temporariamente enquanto o código que usa
-- fn_product_costs/fn_movement_costs não estava no ar; aplicar esta
-- migration só depois do deploy desse código.
revoke select on public.products from authenticated;
grant select (id, tenant_id, category_id, supplier_id, default_location_id, sku, barcode, brand, name, attrs, sale_price, min_stock, photo_url, notes, active, created_at) on public.products to authenticated;
revoke select on public.stock_movements from authenticated;
grant select (id, tenant_id, store_id, product_id, kind, qty, unit_price, before_qty, after_qty, reference_type, reference_id, reason, justification, created_by, created_at) on public.stock_movements to authenticated;
