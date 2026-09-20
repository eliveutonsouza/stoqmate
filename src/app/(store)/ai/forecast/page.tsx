import { AIForecast } from '@/features/ai-flows/ai-forecast';
import { loadForecastBase } from '@/features/ai-flows/queries';
import { loadStores } from '@/features/stock/queries';

export default async function Page() {
  const stores = await loadStores();
  const base = stores[0] ? await loadForecastBase(stores[0].id) : [];
  return <AIForecast base={base} />;
}
