import { ImportWizard } from '@/features/import/import-wizard';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const [{ data: stores }, { data: categories }] = await Promise.all([
    supabase.from('stores').select('id, name').order('name'),
    supabase.from('categories').select('id, name, code').order('name'),
  ]);
  return <ImportWizard stores={stores ?? []} categories={categories ?? []} />;
}
