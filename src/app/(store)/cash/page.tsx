import { CashSession } from '@/features/pos/cash-session';
import { loadStores } from '@/features/stock/queries';
import { loadOpenCashSession } from '@/features/pos/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const { store } = await searchParams;
  const stores = await loadStores();
  const storeId = store || stores[0]?.id || '';
  const session = storeId ? await loadOpenCashSession(storeId) : null;

  return <CashSession stores={stores} storeId={storeId} session={session} />;
}
