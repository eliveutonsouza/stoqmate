import { EntryOCR } from '@/features/ai-flows/entry-ocr';
import { loadStores } from '@/features/stock/queries';
import { loadAiQuota } from '@/features/ai/queries';

export default async function Page() {
  const [stores, quota] = await Promise.all([loadStores(), loadAiQuota()]);
  return <EntryOCR stores={stores} quota={quota} />;
}
