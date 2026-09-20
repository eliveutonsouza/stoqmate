import { PurchaseOrders } from '@/features/purchasing/purchase-orders';
import { loadStores } from '@/features/stock/queries';
import { loadReplenishmentSuggestions, loadOpenPurchaseOrders } from '@/features/purchasing/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const { store } = await searchParams;
  const stores = await loadStores();
  const storeId = store || stores[0]?.id || '';
  const [suggestions, openOrders] = await Promise.all([
    storeId ? loadReplenishmentSuggestions(storeId) : Promise.resolve([]),
    loadOpenPurchaseOrders(),
  ]);

  return <PurchaseOrders stores={stores} storeId={storeId} suggestions={suggestions} openOrders={openOrders} />;
}
