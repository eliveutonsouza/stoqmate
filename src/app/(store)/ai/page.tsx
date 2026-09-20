import { AIHub } from '@/features/ai-flows/ai-hub';
import { loadAiQuota } from '@/features/ai/queries';

export default async function Page() {
  const quota = await loadAiQuota();
  return <AIHub quota={quota} />;
}
