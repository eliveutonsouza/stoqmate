import { AIAnomalies } from '@/features/ai-flows/ai-anomalies';
import { loadAnomaliesScreen } from '@/features/ai-flows/queries';

export default async function Page() {
  return <AIAnomalies {...await loadAnomaliesScreen()} />;
}
