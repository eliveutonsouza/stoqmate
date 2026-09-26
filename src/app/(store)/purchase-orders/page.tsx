import { PurchaseOrders } from '@/features/purchasing/purchase-orders';
import { loadPurchaseOrdersScreen } from '@/features/purchasing/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const { store } = await searchParams;
  return <PurchaseOrders {...await loadPurchaseOrdersScreen(store)} />;
}
