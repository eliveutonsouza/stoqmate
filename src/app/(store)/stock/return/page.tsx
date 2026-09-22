import { StockReturn } from '@/features/stock/stock-return';
import { loadStores } from '@/features/stock/queries';

export default async function Page() {
  const stores = await loadStores();
  return <StockReturn stores={stores} />;
}
