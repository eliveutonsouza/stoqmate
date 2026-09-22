import { AIQueue } from '@/features/ai-flows/ai-queue';
import { loadEnrichGaps, loadForecastBase, loadAnomalies } from '@/features/ai-flows/queries';
import { loadStores } from '@/features/stock/queries';

export default async function Page() {
  const stores = await loadStores();
  const storeId = stores[0]?.id;
  const [enrichGaps, forecastBase, anomalies] = await Promise.all([
    loadEnrichGaps(),
    storeId ? loadForecastBase(storeId) : Promise.resolve([]),
    storeId ? loadAnomalies(storeId) : Promise.resolve({ stockouts: [], deadStock: [] }),
  ]);
  return (
    <AIQueue
      enrichCount={enrichGaps.length}
      forecastCount={forecastBase.length}
      anomalyCount={anomalies.stockouts.length + anomalies.deadStock.length}
    />
  );
}
