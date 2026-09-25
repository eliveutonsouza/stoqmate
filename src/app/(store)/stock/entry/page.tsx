import { StockEntry } from '@/features/stock/stock-entry';
import { loadStockEntryScreen } from '@/features/stock/screen-queries';

export default async function Page() {
  const { stores, suppliers, locations } = await loadStockEntryScreen();
  return <StockEntry stores={stores} suppliers={suppliers} locations={locations} />;
}
