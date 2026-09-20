import { Promotions } from '@/features/operations/promotions';
import { loadPromotions } from '@/features/operations/promotions-queries';

export default async function Page() {
  const promotions = await loadPromotions();
  return <Promotions promotions={promotions} />;
}
