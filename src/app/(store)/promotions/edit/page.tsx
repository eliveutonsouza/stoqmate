import { PromotionForm } from '@/features/entities/promotion-form';
import { loadPromotion } from '@/features/operations/promotions-queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const promotion = id ? await loadPromotion(id) : null;
  return <PromotionForm mode="edit" promotion={promotion} />;
}
