import { EntryOCR } from '@/features/ai-flows/entry-ocr';
import { loadOcrContext } from '@/features/ai-flows/queries';
import { loadStores } from '@/features/stock/queries';
import { loadAiQuota } from '@/features/ai/queries';

export default async function Page() {
  const [stores, { categories, products }, quota] = await Promise.all([loadStores(), loadOcrContext(), loadAiQuota()]);
  return <EntryOCR stores={stores} categories={categories} products={products} quota={quota} />;
}
