import { AICredits } from '@/features/credits/ai-credits';
import { loadAiQuota } from '@/features/ai/queries';

export default async function Page() {
  const quota = await loadAiQuota();
  return <AICredits quota={quota} />;
}
