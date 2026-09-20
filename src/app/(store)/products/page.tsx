import { ProductsList } from '@/features/products/products-list';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select(`
        id, sku, barcode, brand, name, attrs, sale_price, cost_price, min_stock,
        category:categories(id, name, code, unit, unit_plural, icon, color),
        supplier:suppliers(id, name),
        location:locations(id, code),
        stock_balances(qty)
      `)
      .order('name'),
    supabase.from('categories').select('id, name, code, unit, icon, color').order('name'),
  ]);

  return <ProductsList initialProducts={products ?? []} categories={categories ?? []} />;
}
