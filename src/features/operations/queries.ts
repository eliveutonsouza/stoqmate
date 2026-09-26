import { createClient } from "@/lib/supabase/server";
import { must } from "@/lib/supabase/must";
import { productCostMap } from "@/lib/supabase/costs";

export async function loadSupplierDetail(id: string) {
  const supabase = await createClient();
  const supplier = must(await supabase
    .from("suppliers")
    .select("id, name, cnpj, phone, whatsapp, order_email, sales_rep, address, brands, lead_time_days, min_order_value, payment_terms, notes, created_at, supplier_categories(category:categories(id, name, icon, color))")
    .eq("id", id)
    .maybeSingle(), "operations/queries.loadSupplierDetail.supplier");
  if (!supplier) return null;

  const [purchasesRes, productsRes, productCountRes] = await Promise.all([
    supabase
      .from("purchase_orders")
      .select("id, status, freight, created_at, received_at, purchase_order_items(qty_ordered, unit_cost)")
      .eq("supplier_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("products")
      .select("id, sku, name, attrs, stock_balances(qty)")
      .eq("supplier_id", id)
      .order("name")
      .limit(50),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("supplier_id", id),
  ]);
  const purchases = must(purchasesRes, "operations.loadSupplierDetail.purchases");
  const products = must(productsRes, "operations.loadSupplierDetail.products");
  must(productCountRes, "operations.loadSupplierDetail.productCount");
  const productCount = productCountRes.count;

  const receivedOrders = (purchases ?? []).filter((p) => p.received_at);
  const avgLeadDays = receivedOrders.length
    ? Math.round(
        receivedOrders.reduce((s, p) => s + (new Date(p.received_at!).getTime() - new Date(p.created_at).getTime()) / 86400000, 0)
          / receivedOrders.length,
      )
    : null;
  // Valor do pedido pelo custo registrado no próprio item (o custo de
  // cadastro do produto é fechado pra leitura e pode ter mudado depois).
  const costOf = (item: { unit_cost: number | null }) => Number(item.unit_cost ?? 0);
  const costById = await productCostMap(supabase, (products ?? []).map((p) => p.id));

  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const purchasedLast12m = (purchases ?? [])
    .filter((p) => new Date(p.created_at) >= yearAgo)
    .reduce(
      (s, p) => s + (p.purchase_order_items ?? []).reduce((si: number, i) => si + i.qty_ordered * costOf(i), 0),
      0,
    );

  return {
    ...supplier,
    cats: (supplier.supplier_categories || []).map((sc: { category: unknown }) => sc.category).filter(Boolean),
    productCount: productCount ?? 0,
    avgLeadDays,
    purchasedRecently: purchasedLast12m,
    purchases: (purchases ?? []).map((p) => ({
      ...p,
      items: (p.purchase_order_items ?? []).reduce((s: number, i: { qty_ordered: number }) => s + i.qty_ordered, 0),
      value: (p.purchase_order_items ?? []).reduce((s: number, i) => s + i.qty_ordered * costOf(i), 0) + Number(p.freight ?? 0),
    })),
    products: (products ?? []).map((p) => ({
      ...p,
      cost_price: costById.get(p.id) ?? null,
      stock: (p.stock_balances ?? []).reduce((s: number, b: { qty: number }) => s + b.qty, 0),
    })),
  };
}

export async function loadLocationFormData(id?: string) {
  const supabase = await createClient();
  const [categoriesRes, storesRes, locationResult, countResult] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("stores").select("id, name").order("name"),
    id
      ? supabase.from("locations").select("id, code, description, store_id, location_categories(category_id)").eq("id", id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    id
      ? supabase.from("products").select("id", { count: "exact", head: true }).eq("default_location_id", id)
      : Promise.resolve({ data: null, count: 0, error: null }),
  ]);
  const categories = must(categoriesRes, "operations.loadLocationFormData.categories");
  const stores = must(storesRes, "operations.loadLocationFormData.stores");
  const locationRow = must(locationResult, "operations.loadLocationFormData.location");
  must(countResult, "operations.loadLocationFormData.productCount");
  const location = locationRow
    ? { ...locationRow, categoryIds: (locationRow.location_categories || []).map((lc: { category_id: string }) => lc.category_id) }
    : null;
  return { categories: categories ?? [], stores: stores ?? [], location, productCount: countResult.count ?? 0 };
}

export async function loadSupplierFormData(id?: string) {
  const supabase = await createClient();
  const [categoriesRes, supplierResult] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    id
      ? supabase.from("suppliers").select("id, name, cnpj, phone, whatsapp, order_email, sales_rep, address, brands, lead_time_days, min_order_value, payment_terms, notes, supplier_categories(category_id)").eq("id", id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  const categories = must(categoriesRes, "operations.loadSupplierFormData.categories");
  const supplierRow = must(supplierResult, "operations.loadSupplierFormData.supplier");
  const supplier = supplierRow
    ? { ...supplierRow, categoryIds: (supplierRow.supplier_categories || []).map((sc: { category_id: string }) => sc.category_id) }
    : null;
  return { categories: categories ?? [], supplier };
}

// `products(count)` monta a linha inteira de products e a coluna de custo é
// fechada pra leitura (20260926120000_cost_visibility) — busca só os ids e
// devolve no mesmo formato [{ count }] que a tela já usa.
export async function loadShelvesScreen() {
  const supabase = await createClient();
  const [locationsRes, productsRes, storesRes] = await Promise.all([
    supabase.from("locations").select("id, code, description, store_id, products(id)").order("code"),
    supabase.from("products").select("id, sku, name, attrs, default_location_id, category:categories(id, name, code, icon, color)").order("name"),
    supabase.from("stores").select("id, name").order("name"),
  ]);
  return {
    locations: (must(locationsRes, "shelves.locations") ?? []).map(({ products, ...l }) => ({ ...l, products: [{ count: products?.length ?? 0 }] })),
    products: must(productsRes, "shelves.products") ?? [],
    stores: must(storesRes, "shelves.stores") ?? [],
  };
}
