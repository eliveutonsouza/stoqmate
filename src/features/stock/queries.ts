import { createClient } from '@/lib/supabase/server';

export async function loadStores() {
  const supabase = await createClient();
  const { data } = await supabase.from('stores').select('id, name, type').order('name');
  return data ?? [];
}
