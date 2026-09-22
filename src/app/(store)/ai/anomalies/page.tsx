import { AIAnomalies } from '@/features/ai-flows/ai-anomalies';
import { loadAnomalies } from '@/features/ai-flows/queries';
import { loadStores } from '@/features/stock/queries';

export default async function Page() {
  const stores = await loadStores();
  const data = stores[0] ? await loadAnomalies(stores[0].id) : { stockouts: [], deadStock: [] };
  return <AIAnomalies {...data} />;
}
