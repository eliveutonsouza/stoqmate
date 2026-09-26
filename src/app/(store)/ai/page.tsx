import { AIHub } from '@/features/ai-flows/ai-hub';
import { loadAiQuota } from '@/features/ai/queries';
import { loadAiQueueCounts } from '@/features/ai-flows/queries';

export default async function Page() {
  const [quota, counts] = await Promise.all([loadAiQuota(), loadAiQueueCounts()]);
  return <AIHub quota={quota} pendingCount={counts.pendingCount} />;
}
