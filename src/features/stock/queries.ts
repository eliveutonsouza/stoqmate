import { createClient } from '@/lib/supabase/server';
import { must } from '@/lib/supabase/must';
import { type RawSearchParams, PAGE_SIZE, oneOf, pageParam, pageRange, param, uuidParam } from '@/lib/list-params';

export const MOVEMENT_KINDS = ['sale', 'entry', 'return', 'exchange', 'transfer', 'adjustment', 'count'] as const;

export function movementListArgs(
  filters: { q: string | null; kind: string | null; store: string | null },
  limit: number,
  offset: number,
) {
  return { p_term: filters.q, p_kind: filters.kind, p_store_id: filters.store, p_limit: limit, p_offset: offset };
}

// Histórico de movimentações (/stock/history): busca (?q) por SKU/código
// de barras/nome do produto, filtros ?kind e ?store, ?page — no servidor
// via fn_stock_movements_list (antes: as 100 últimas, sem aviso).
export async function loadStockHistory(sp: RawSearchParams) {
  const filters = {
    q: param(sp, 'q'),
    kind: oneOf(sp, 'kind', MOVEMENT_KINDS),
    store: uuidParam(sp, 'store'),
    page: pageParam(sp),
  };
  const { offset, limit } = pageRange(filters.page);
  const supabase = await createClient();
  const [list, stores] = await Promise.all([
    supabase.rpc('fn_stock_movements_list', movementListArgs(filters, limit, offset)),
    supabase.from('stores').select('id, name').order('name'),
  ]);
  const data = must(list, 'loadStockHistory');
  return {
    filters,
    pageSize: PAGE_SIZE,
    rows: data?.rows ?? [],
    total: Number(data?.total ?? 0),
    allTotal: Number(data?.all_total ?? 0),
    kinds: ((data?.kinds ?? []) as { kind: string; count: number }[]).map((k) => ({ kind: k.kind, count: Number(k.count) })),
    kpis: {
      qtyIn: Number(data?.qty_in ?? 0),
      qtyOut: Number(data?.qty_out ?? 0),
      transfers: Number(data?.transfers ?? 0),
    },
    stores: must(stores, 'loadStockHistory.stores') ?? [],
  };
}

export async function loadStores() {
  const supabase = await createClient();
  const data = must(await supabase.from('stores').select('id, name, type').order('name'), "stock/queries.loadStores.data");
  return data ?? [];
}

export async function loadStockHubData() {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [overviewRes, categoriesRes, balanceRowsRes, movementRowsRes, lowStockItems] = await Promise.all([
    supabase.rpc('fn_stock_overview'),
    supabase.from('categories').select('id, name, icon, color, unit_plural'),
    supabase.from('stock_balances').select('qty, product:products(category_id)'),
    supabase.from('stock_movements').select('kind').gte('created_at', since.toISOString()),
    loadLowStockItems(5),
  ]);
  const overview = must(overviewRes, "stock.loadStockHubData.overview");
  const categories = must(categoriesRes, "stock.loadStockHubData.categories");
  const balanceRows = must(balanceRowsRes, "stock.loadStockHubData.balanceRows");
  const movementRows = must(movementRowsRes, "stock.loadStockHubData.movementRows");

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
  const movement = must(await supabase
    .from('stock_movements')
    .select(`
      id, kind, qty, unit_cost, unit_price, before_qty, after_qty, reason, justification,
      reference_type, reference_id, created_at, created_by,
      product:products(id, sku, name, brand, attrs, category:categories(id, name, icon, color)),
      store:stores(id, name)
    `)
    .eq('id', id)
    .maybeSingle(), "stock/queries.loadMovementDetail.movement");
  if (!movement) return null;

  const [profileRes, balanceRes] = await Promise.all([
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
  const profile = must(profileRes, "stock/queries.loadMovementDetail.profile");
  const balance = must(balanceRes, "stock/queries.loadMovementDetail.balance");

  return { ...movement, byName: profile?.full_name || 'Usuário', currentQty: balance?.qty ?? movement.after_qty };
}

export async function loadLowStockItems(limit = 6) {
  const supabase = await createClient();
  const data = must(await supabase
    .from('products')
    .select('id, sku, name, min_stock, stock_balances(qty)')
    .eq('active', true), "stock/queries.loadLowStockItems.data");
  return (data ?? [])
    .map((p) => ({ ...p, totalQty: (p.stock_balances ?? []).reduce((s: number, b: { qty: number }) => s + b.qty, 0) }))
    .filter((p) => p.min_stock > 0 && p.totalQty < p.min_stock)
    .sort((a, b) => (a.totalQty - a.min_stock) - (b.totalQty - b.min_stock))
    .slice(0, limit);
}
