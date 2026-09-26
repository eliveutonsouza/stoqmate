import { AIForecast } from '@/features/ai-flows/ai-forecast';
import { loadForecastScreen } from '@/features/ai-flows/queries';

export default async function Page() {
  return <AIForecast base={await loadForecastScreen()} />;
}
