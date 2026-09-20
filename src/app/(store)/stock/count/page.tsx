import { StockCount } from '@/features/stock/stock-count';
import { loadStores } from '@/features/stock/queries';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const [stores, { data: locations }, { data: categories }] = await Promise.all([
    loadStores(),
    supabase.from('locations').select('id, code').order('code'),
    supabase.from('categories').select('id, name').order('name'),
  ]);

  return <StockCount stores={stores} locations={locations ?? []} categories={categories ?? []} />;
}
