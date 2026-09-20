import { StockSale } from '@/features/stock/stock-sale';
import { loadStores } from '@/features/stock/queries';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const [stores, { data: openSessions }] = await Promise.all([
    loadStores(),
    supabase.from('cash_sessions').select('id, store_id').eq('status', 'open'),
  ]);
  const cashSessionByStore = Object.fromEntries((openSessions ?? []).map((s) => [s.store_id, s.id]));

  return <StockSale stores={stores} cashSessionByStore={cashSessionByStore} />;
}
