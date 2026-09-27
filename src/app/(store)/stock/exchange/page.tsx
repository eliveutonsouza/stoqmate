import { StockExchange } from '@/features/stock/stock-exchange';
import { loadStockSaleScreen } from '@/features/stock/screen-queries';

export default async function Page() {
  // Caixas abertos: diferença paga ou devolvida em dinheiro passa pelo caixa.
  const { stores, cashSessionByStore, canRefund } = await loadStockSaleScreen();
  return <StockExchange stores={stores} cashSessionByStore={cashSessionByStore} canRefund={canRefund} />;
}
