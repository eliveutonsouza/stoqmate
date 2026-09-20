import { Shelves } from '@/features/operations/shelves';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const [{ data: locations }, { data: products }, { data: stores }] = await Promise.all([
    supabase.from('locations').select('id, code, description, store_id, products(count)').order('code'),
    supabase.from('products').select('id, sku, name, attrs, default_location_id, category:categories(id, name, icon, color)').order('name'),
    supabase.from('stores').select('id, name').order('name'),
  ]);

  return <Shelves initialLocations={locations ?? []} products={products ?? []} stores={stores ?? []} />;
}
