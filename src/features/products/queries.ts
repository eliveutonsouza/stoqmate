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

export async function loadProduct(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(`
      id, sku, barcode, brand, name, attrs, cost_price, sale_price, min_stock, notes, photo_url, created_at,
      category:categories(id, name, code, icon, color, unit, unit_plural),
      supplier:suppliers(id, name),
      default_location:locations(id, code)
    `)
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

// Sem dependência de storeId (só usado depois, na hora de exibir) — deixa o
// chamador buscar isto em paralelo com a loja atual em vez de encadear.
export async function loadProductDetail(id: string) {
  const supabase = await createClient();
  const product = await loadProduct(id);
  if (!product) return null;
  const categoryId = (product.category as unknown as { id: string }).id;

  const [{ data: balances }, { data: siblings }, { data: movements }, { data: categoryAttributes }] = await Promise.all([
    supabase.from("stock_balances").select("store_id, qty, store:stores(id, name)").eq("product_id", id),
    supabase
      .from("products")
      .select("id, sku, attrs, stock_balances(store_id, qty)")
      .eq("category_id", categoryId)
      .eq("brand", product.brand)
      .eq("name", product.name)
      .order("sku"),
    supabase
      .from("stock_movements")
      .select("id, kind, qty, unit_price, reference_type, reference_id, created_by, created_at")
      .eq("product_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("category_attributes").select("id, key, label, type, values, position").eq("category_id", categoryId).order("position"),
  ]);

  const userIds = [...new Set((movements ?? []).map((m) => m.created_by).filter(Boolean))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };
  const nameById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name || "Usuário"]));

  return {
    product: { ...product, category: { ...product.category, category_attributes: categoryAttributes ?? [] } },
    balances: balances ?? [],
    siblings: siblings ?? [],
    movements: (movements ?? []).map((m) => ({ ...m, byName: nameById[m.created_by ?? ""] || "Usuário" })),
  };
}

// Aplica a loja atual sobre o resultado de loadProductDetail — pura, sem
// I/O, então pode rodar depois que loadStores() e loadProductDetail()
// já tiverem resolvido em paralelo.
export function shapeProductDetailForStore(detail: NonNullable<Awaited<ReturnType<typeof loadProductDetail>>>, storeId: string) {
  return {
    product: detail.product,
    stockByStore: detail.balances.map((b) => ({ ...b, current: b.store_id === storeId })),
    currentStock: detail.balances.find((b) => b.store_id === storeId)?.qty ?? 0,
    siblings: detail.siblings.map((s) => ({
      ...s,
      stock: (s.stock_balances as { store_id: string; qty: number }[]).find((b) => b.store_id === storeId)?.qty ?? 0,
    })),
    movements: detail.movements,
  };
}
