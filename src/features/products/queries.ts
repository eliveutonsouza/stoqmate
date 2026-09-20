import { createClient } from '@/lib/supabase/server';

// Compartilhado por /products/new e /products/edit — as duas rotas hoje
// renderizam o mesmo ProductForm sem distinção real (nenhuma rota dinâmica
// [id] existe ainda, ver .spec/routing.md), então pedem o mesmo dado.
export async function loadProductFormData() {
  const supabase = await createClient();
  const [{ data: categories }, { data: suppliers }, { data: locations }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, code, unit, icon, color, category_attributes(id, key, label, type, values, position)')
      .order('name'),
    supabase.from('suppliers').select('id, name').order('name'),
    supabase.from('locations').select('id, code').order('code'),
  ]);

  return { categories: categories ?? [], suppliers: suppliers ?? [], locations: locations ?? [] };
}
