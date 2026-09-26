import { AIQueue } from '@/features/ai-flows/ai-queue';
import { loadAiQueueCounts } from '@/features/ai-flows/queries';

export default async function Page() {
  const { enrichCount, forecastCount, anomalyCount } = await loadAiQueueCounts();
  return <AIQueue enrichCount={enrichCount} forecastCount={forecastCount} anomalyCount={anomalyCount} />;
}
