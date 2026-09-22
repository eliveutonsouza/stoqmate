import { createClient } from '@/lib/supabase/server';

export async function loadStores() {
  const supabase = await createClient();
  const { data } = await supabase.from('stores').select('id, name, type').order('name');
  return data ?? [];
}

export async function loadStockHubData() {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [{ data: overview }, { data: categories }, { data: balanceRows }, { data: movementRows }, lowStockItems] = await Promise.all([
    supabase.rpc('fn_stock_overview'),
    supabase.from('categories').select('id, name, icon, color, unit_plural'),
    supabase.from('stock_balances').select('qty, product:products(category_id)'),
    supabase.from('stock_movements').select('kind').gte('created_at', since.toISOString()),
    loadLowStockItems(5),
  ]);

  const byCategory = new Map<string, { skuCount: number; qty: number }>();
  for (const row of balanceRows ?? []) {
    const categoryId = (row.product as unknown as { category_id: string } | null)?.category_id;
    if (!categoryId) continue;
    const entry = byCategory.get(categoryId) ?? { skuCount: 0, qty: 0 };
    if (row.qty > 0) entry.skuCount += 1;
    entry.qty += row.qty;
    byCategory.set(categoryId, entry);
  }
  const categoryBalances = (categories ?? [])
    .map((c) => ({ ...c, ...(byCategory.get(c.id) ?? { skuCount: 0, qty: 0 }) }))
    .filter((c) => c.qty > 0)
    .sort((a, b) => b.qty - a.qty);

  const flowCounts: Record<string, number> = {};
  for (const row of movementRows ?? []) {
    flowCounts[row.kind] = (flowCounts[row.kind] ?? 0) + 1;
  }

  return {
    overview: overview ?? { sku_count: 0, total_qty: 0, total_cost_value: 0, low_stock_count: 0, rupture_count: 0 },
    categoryBalances,
    flowCounts,
    lowStockItems,
  };
}

export async function loadMovementDetail(id: string) {
  const supabase = await createClient();
  const { data: movement } = await supabase
    .from('stock_movements')
    .select(`
      id, kind, qty, unit_cost, unit_price, before_qty, after_qty, reason, justification,
      reference_type, reference_id, created_at, created_by,
      product:products(id, sku, name, brand, attrs, category:categories(id, name, icon, color)),
      store:stores(id, name)
    `)
    .eq('id', id)
    .maybeSingle();
  if (!movement) return null;

  const [{ data: profile }, { data: balance }] = await Promise.all([
    movement.created_by
      ? supabase.from('profiles').select('full_name').eq('id', movement.created_by).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('stock_balances')
      .select('qty')
      .eq('product_id', (movement.product as unknown as { id: string })?.id)
      .eq('store_id', (movement.store as unknown as { id: string })?.id)
      .maybeSingle(),
  ]);

  return { ...movement, byName: profile?.full_name || 'Usuário', currentQty: balance?.qty ?? movement.after_qty };
}

export async function loadLowStockItems(limit = 6) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('products')
    .select('id, sku, name, min_stock, stock_balances(qty)')
    .eq('active', true);
  return (data ?? [])
    .map((p) => ({ ...p, totalQty: (p.stock_balances ?? []).reduce((s: number, b: { qty: number }) => s + b.qty, 0) }))
    .filter((p) => p.min_stock > 0 && p.totalQty < p.min_stock)
    .sort((a, b) => (a.totalQty - a.min_stock) - (b.totalQty - b.min_stock))
    .slice(0, limit);
}
