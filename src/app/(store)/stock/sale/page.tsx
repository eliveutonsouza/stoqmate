import { StockSale } from '@/features/stock/stock-sale';
import { loadStockSaleScreen } from '@/features/stock/screen-queries';

export default async function Page() {
  const { stores, cashSessionByStore } = await loadStockSaleScreen();
  return <StockSale stores={stores} cashSessionByStore={cashSessionByStore} />;
}
