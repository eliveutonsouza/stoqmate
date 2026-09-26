import { createClient } from '@/lib/supabase/server';
import { must } from '@/lib/supabase/must';
import { type RawSearchParams, PAGE_SIZE, oneOf, pageParam, pageRange, param, uuidParam } from '@/lib/list-params';
import { loadStores } from '@/features/stock/queries';
import { resolveStoreId } from '@/features/shell/queries';

export const PRODUCT_STOCK_FILTERS = ['in', 'low', 'out'] as const;

// Lista do catálogo (/products): busca (?q) em SKU/código de barras/nome/
// marca, filtros ?category ?brand ?stock ?location e ?page — tudo no
// servidor via fn_products_list (termo como parâmetro ligado, nunca
// dentro de filtro PostgREST). Facetas (abas por categoria, marcas) são
// do catálogo inteiro.
export async function loadProductsList(sp: RawSearchParams) {
  const filters = {
    q: param(sp, 'q'),
    category: uuidParam(sp, 'category'),
    brand: param(sp, 'brand'),
    stock: oneOf(sp, 'stock', PRODUCT_STOCK_FILTERS),
    location: uuidParam(sp, 'location'),
    page: pageParam(sp),
  };
  const { offset, limit } = pageRange(filters.page);
  const supabase = await createClient();
  const [list, facets, categories, locations] = await Promise.all([
    supabase.rpc('fn_products_list', {
      p_term: filters.q, p_category_id: filters.category, p_brand: filters.brand,
      p_stock: filters.stock, p_location_id: filters.location, p_limit: limit, p_offset: offset,
    }),
    supabase.rpc('fn_products_facets'),
    supabase.from('categories').select('id, name, code, unit, icon, color').order('name'),
    supabase.from('locations').select('id, code, store:stores(name)').order('code'),
  ]);
  const listData = must(list, 'loadProductsList');
  const facetData = must(facets, 'loadProductsList.facets');

  return {
    filters,
    pageSize: PAGE_SIZE,
    rows: listData?.rows ?? [],
    total: Number(listData?.total ?? 0),
    catalogTotal: Number(facetData?.total ?? 0),
    countByCategory: Object.fromEntries(
      ((facetData?.by_category ?? []) as { category_id: string; count: number }[]).map((c) => [c.category_id, Number(c.count)]),
    ),
    brands: (facetData?.brands ?? []) as string[],
    categories: must(categories, 'loadProductsList.categories') ?? [],
    locations: (must(locations, 'loadProductsList.locations') ?? []).map((l) => ({
      id: l.id, code: l.code, store: (l.store as unknown as { name: string } | null)?.name ?? null,
    })),
  };
}

// Compartilhado por /products/new e /products/edit — as duas rotas hoje
// renderizam o mesmo ProductForm sem distinção real (nenhuma rota dinâmica
// [id] existe ainda, ver .spec/routing.md), então pedem o mesmo dado.
export async function loadProductFormData() {
  const supabase = await createClient();
  const [categoriesRes, suppliersRes, locationsRes] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, code, unit, icon, color, category_attributes(id, key, label, type, values, position)')
      .order('name'),
    supabase.from('suppliers').select('id, name').order('name'),
    supabase.from('locations').select('id, code').order('code'),
  ]);
  const categories = must(categoriesRes, "products/queries.loadProductFormData.categories");
  const suppliers = must(suppliersRes, "products/queries.loadProductFormData.suppliers");
  const locations = must(locationsRes, "products/queries.loadProductFormData.locations");

  return { categories: categories ?? [], suppliers: suppliers ?? [], locations: locations ?? [] };
}

export async function loadProduct(id: string) {
  const supabase = await createClient();
  const data = must(await supabase
    .from("products")
    .select(`
      id, sku, barcode, brand, name, attrs, cost_price, sale_price, min_stock, notes, photo_url, created_at,
      category:categories(id, name, code, icon, color, unit, unit_plural),
      supplier:suppliers(id, name),
      default_location:locations(id, code)
    `)
    .eq("id", id)
    .maybeSingle(), "products/queries.loadProduct.data");
  return data ?? null;
}

// Sem dependência de storeId (só usado depois, na hora de exibir) — deixa o
// chamador buscar isto em paralelo com a loja atual em vez de encadear.
export async function loadProductDetail(id: string) {
  const supabase = await createClient();
  const product = await loadProduct(id);
  if (!product) return null;
  const categoryId = (product.category as unknown as { id: string }).id;

  const [balancesRes, siblingsRes, movementsRes, categoryAttributesRes] = await Promise.all([
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
  const balances = must(balancesRes, "products/queries.loadProductDetail.balances");
  const siblings = must(siblingsRes, "products/queries.loadProductDetail.siblings");
  const movements = must(movementsRes, "products/queries.loadProductDetail.movements");
  const categoryAttributes = must(categoryAttributesRes, "products/queries.loadProductDetail.categoryAttributes");

  const userIds = [...new Set((movements ?? []).map((m) => m.created_by).filter(Boolean))];
  const profiles = userIds.length ? must(await supabase.from("profiles").select("id, full_name").in("id", userIds), "products.profiles") : [];
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

export async function loadCategoriesScreen() {
  const supabase = await createClient();
  return must(
    await supabase
      .from('categories')
      .select('id, name, icon, color, unit, unit_plural, code, active, category_attributes(id, key, label, type, values, position), products(count)')
      .order('name'),
    'categories.list',
  ) ?? [];
}

export async function loadImportScreen() {
  const supabase = await createClient();
  const [storesRes, categoriesRes] = await Promise.all([
    supabase.from('stores').select('id, name').order('name'),
    supabase.from('categories').select('id, name, code').order('name'),
  ]);
  return { stores: must(storesRes, 'import.stores') ?? [], categories: must(categoriesRes, 'import.categories') ?? [] };
}

// Detalhe do produto com saldo/local da loja ativa da sidebar.
export async function loadProductDetailScreen(id: string) {
  const [stores, rawDetail] = await Promise.all([loadStores(), loadProductDetail(id)]);
  if (!rawDetail) return null;
  return shapeProductDetailForStore(rawDetail, (await resolveStoreId(stores)) ?? '');
}
