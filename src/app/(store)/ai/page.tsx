import { AIHub } from '@/features/ai-flows/ai-hub';
import { loadAiQuota } from '@/features/ai/queries';
import { loadEnrichGaps, loadForecastBase, loadAnomalies } from '@/features/ai-flows/queries';
import { loadStores } from '@/features/stock/queries';

export default async function Page() {
  const stores = await loadStores();
  const storeId = stores[0]?.id;
  const [quota, enrichGaps, forecastBase, anomalies] = await Promise.all([
    loadAiQuota(),
    loadEnrichGaps(),
    storeId ? loadForecastBase(storeId) : Promise.resolve([]),
    storeId ? loadAnomalies(storeId) : Promise.resolve({ stockouts: [], deadStock: [] }),
  ]);
  const pendingCount = enrichGaps.length + forecastBase.length + anomalies.stockouts.length + anomalies.deadStock.length;
  return <AIHub quota={quota} pendingCount={pendingCount} />;
}
