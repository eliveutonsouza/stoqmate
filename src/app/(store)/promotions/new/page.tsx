import { PromotionForm } from '@/features/entities/promotion-form';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from('categories').select('id, name, code, icon, color').order('name');
  return <PromotionForm categories={categories ?? []} promotion={null} />;
}
