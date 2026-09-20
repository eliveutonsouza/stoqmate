import { Suppliers } from '@/features/operations/suppliers';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const [{ data: suppliers }, { data: categories }] = await Promise.all([
    supabase
      .from('suppliers')
      .select('id, name, cnpj, phone, order_email, brands, lead_time_days, supplier_categories(category:categories(id, name, icon, color))')
      .order('name'),
    supabase.from('categories').select('id, name').order('name'),
  ]);

  return <Suppliers initialSuppliers={suppliers ?? []} categories={categories ?? []} />;
}
