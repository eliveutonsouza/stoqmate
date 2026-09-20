import { StockHistory } from '@/features/stock/stock-history';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const { data: movements } = await supabase
    .from('stock_movements')
    .select(`
      id, kind, qty, unit_cost, unit_price, created_at, reason,
      product:products(id, sku, name, category:categories(id, name, icon, color)),
      store:stores(id, name)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  return <StockHistory movements={movements ?? []} />;
}
