import { StockAdjustment } from '@/features/stock/stock-adjustment';
import { loadStores } from '@/features/stock/queries';

export default async function Page() {
  const stores = await loadStores();
  return <StockAdjustment stores={stores} />;
}
