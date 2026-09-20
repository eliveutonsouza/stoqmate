import { StockTransfer } from '@/features/stock/stock-transfer';
import { loadStores } from '@/features/stock/queries';

export default async function Page() {
  const stores = await loadStores();
  return <StockTransfer stores={stores} />;
}
