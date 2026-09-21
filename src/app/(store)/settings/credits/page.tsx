import { AICredits } from '@/features/credits/ai-credits';
import { loadAiQuota, loadCreditPacks } from '@/features/ai/queries';

export default async function Page() {
  const [quota, packs] = await Promise.all([loadAiQuota(), loadCreditPacks()]);
  return <AICredits quota={quota} packs={packs} />;
}
