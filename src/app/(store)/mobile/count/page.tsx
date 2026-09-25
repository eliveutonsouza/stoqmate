import { MobileCount } from '@/features/mobile/mobile-count';
import { loadStockCountScreen } from '@/features/stock/screen-queries';

export default async function Page() {
  const { stores, locations } = await loadStockCountScreen();
  return <MobileCount stores={stores} locations={locations} />;
}
