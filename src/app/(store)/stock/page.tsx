import { StockHub } from '@/features/stock/stock-hub';
import { loadStockHubData } from '@/features/stock/queries';

export default async function Page() {
  const data = await loadStockHubData();
  return <StockHub {...data} />;
}
