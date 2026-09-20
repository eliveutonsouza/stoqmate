import { AIEnrich } from '@/features/ai-flows/ai-enrich';
import { loadEnrichGaps } from '@/features/ai-flows/queries';
import { loadProductFormData } from '@/features/products/queries';

export default async function Page() {
  const [gaps, { categories }] = await Promise.all([loadEnrichGaps(), loadProductFormData()]);
  return <AIEnrich gaps={gaps} categories={categories} />;
}
