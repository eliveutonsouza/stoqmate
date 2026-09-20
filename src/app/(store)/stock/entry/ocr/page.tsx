import { EntryOCR } from '@/features/ai-flows/entry-ocr';
import { loadOcrContext } from '@/features/ai-flows/queries';
import { loadStores } from '@/features/stock/queries';

export default async function Page() {
  const [stores, { categories, products }] = await Promise.all([loadStores(), loadOcrContext()]);
  return <EntryOCR stores={stores} categories={categories} products={products} />;
}
