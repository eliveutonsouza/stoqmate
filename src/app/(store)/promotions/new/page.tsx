import { PromotionForm } from '@/features/entities/promotion-form';
import { loadPromotionFormCategories } from '@/features/operations/promotions-queries';

export default async function Page() {
  const categories = await loadPromotionFormCategories();
  return <PromotionForm categories={categories} promotion={null} />;
}
