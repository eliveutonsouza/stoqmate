import { StockEntry } from '@/features/stock/stock-entry';
import { loadStores } from '@/features/stock/queries';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const [stores, { data: suppliers }, { data: locations }] = await Promise.all([
    loadStores(),
    supabase.from('suppliers').select('id, name').order('name'),
    supabase.from('locations').select('id, code').order('code'),
  ]);

  return <StockEntry stores={stores} suppliers={suppliers ?? []} locations={locations ?? []} />;
}
