import { PurchaseOrderNew } from '@/features/purchasing/purchase-order-new';
import { loadStores } from '@/features/stock/queries';
import { loadReplenishmentSuggestions } from '@/features/purchasing/queries';
import { createClient } from '@/lib/supabase/server';

export default async function Page({ searchParams }: { searchParams: Promise<{ store?: string; supplier?: string }> }) {
  const { store, supplier } = await searchParams;
  const supabase = await createClient();
  const stores = await loadStores();
  const storeId = store || stores[0]?.id || '';
  const [suggestions, { data: suppliers }] = await Promise.all([
    storeId ? loadReplenishmentSuggestions(storeId) : Promise.resolve([]),
    supabase.from('suppliers').select('id, name, lead_time_days, min_order_value').order('name'),
  ]);

  return (
    <PurchaseOrderNew
      key={`${storeId}:${supplier || suppliers?.[0]?.id || ''}`}
      stores={stores}
      storeId={storeId}
      suppliers={suppliers ?? []}
      supplierId={supplier || suppliers?.[0]?.id || ''}
      suggestions={suggestions}
    />
  );
}
