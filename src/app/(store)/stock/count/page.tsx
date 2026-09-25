import { StockCount } from '@/features/stock/stock-count';
import { loadStockCountScreen } from '@/features/stock/screen-queries';

export default async function Page() {
  const { stores, locations, categories } = await loadStockCountScreen();
  return <StockCount stores={stores} locations={locations} categories={categories} />;
}
