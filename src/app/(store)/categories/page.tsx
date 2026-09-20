import { Categories } from '@/features/products/categories';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, icon, color, unit, unit_plural, code, active, category_attributes(id, key, label, type, values, position), products(count)')
    .order('name');

  return <Categories initialCategories={categories ?? []} />;
}
