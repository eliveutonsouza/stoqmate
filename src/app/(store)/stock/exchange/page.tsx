import { StockExchange } from '@/features/stock/stock-exchange';
import { loadStores } from '@/features/stock/queries';

export default async function Page() {
  const stores = await loadStores();
  return <StockExchange stores={stores} />;
}
