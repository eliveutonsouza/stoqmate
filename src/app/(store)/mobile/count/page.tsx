import { MobileCount } from '@/features/mobile/mobile-count';
import { loadStores } from '@/features/stock/queries';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const [stores, { data: locations }] = await Promise.all([
    loadStores(),
    supabase.from('locations').select('id, code, store_id').order('code'),
  ]);
  return <MobileCount stores={stores} locations={locations ?? []} />;
}
