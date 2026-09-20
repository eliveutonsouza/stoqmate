import { AIEnrich } from '@/features/ai-flows/ai-enrich';
import { loadEnrichGaps } from '@/features/ai-flows/queries';
import { loadProductFormData } from '@/features/products/queries';
import { loadAiQuota } from '@/features/ai/queries';

export default async function Page() {
  const [gaps, { categories }, quota] = await Promise.all([loadEnrichGaps(), loadProductFormData(), loadAiQuota()]);
  return <AIEnrich gaps={gaps} categories={categories} quota={quota} />;
}
