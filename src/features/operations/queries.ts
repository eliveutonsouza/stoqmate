import { createClient } from "@/lib/supabase/server";

export async function loadSupplierDetail(id: string) {
  const supabase = await createClient();
  const { data: supplier } = await supabase
    .from("suppliers")
    .select("id, name, cnpj, phone, whatsapp, order_email, sales_rep, address, brands, lead_time_days, min_order_value, payment_terms, notes, created_at, supplier_categories(category:categories(id, name, icon, color))")
    .eq("id", id)
    .maybeSingle();
  if (!supplier) return null;

  const [{ data: purchases }, { data: products }, { count: productCount }] = await Promise.all([
    supabase
      .from("purchase_orders")
      .select("id, status, freight, created_at, received_at, purchase_order_items(qty_ordered, product:products(cost_price))")
      .eq("supplier_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("products")
      .select("id, sku, name, attrs, cost_price, stock_balances(qty)")
      .eq("supplier_id", id)
      .order("name")
      .limit(50),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("supplier_id", id),
  ]);

  const receivedOrders = (purchases ?? []).filter((p) => p.received_at);
  const avgLeadDays = receivedOrders.length
    ? Math.round(
        receivedOrders.reduce((s, p) => s + (new Date(p.received_at!).getTime() - new Date(p.created_at).getTime()) / 86400000, 0)
          / receivedOrders.length,
      )
    : null;
  // PostgREST devolve o embed `product` como array quando não consegue provar
  // cardinalidade 1 pelo schema — mesmo caso já tratado em loadSubscriptionDetail.
  const costOf = (item: { product: { cost_price: number } | { cost_price: number }[] | null }) => {
    const p = Array.isArray(item.product) ? item.product[0] : item.product;
    return p?.cost_price ?? 0;
  };

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
      stock: (p.stock_balances ?? []).reduce((s: number, b: { qty: number }) => s + b.qty, 0),
    })),
  };
}

export async function loadLocationFormData(id?: string) {
  const supabase = await createClient();
  const [{ data: categories }, { data: stores }, locationResult, countResult] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("stores").select("id, name").order("name"),
    id
      ? supabase.from("locations").select("id, code, description, store_id, location_categories(category_id)").eq("id", id).maybeSingle()
      : Promise.resolve({ data: null }),
    id
      ? supabase.from("products").select("id", { count: "exact", head: true }).eq("default_location_id", id)
      : Promise.resolve({ count: 0 }),
  ]);
  const location = locationResult.data
    ? { ...locationResult.data, categoryIds: (locationResult.data.location_categories || []).map((lc: { category_id: string }) => lc.category_id) }
    : null;
  return { categories: categories ?? [], stores: stores ?? [], location, productCount: countResult.count ?? 0 };
}

export async function loadSupplierFormData(id?: string) {
  const supabase = await createClient();
  const [{ data: categories }, supplierResult] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    id
      ? supabase.from("suppliers").select("id, name, cnpj, phone, whatsapp, order_email, sales_rep, address, brands, lead_time_days, min_order_value, payment_terms, notes, supplier_categories(category_id)").eq("id", id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const supplier = supplierResult.data
    ? { ...supplierResult.data, categoryIds: (supplierResult.data.supplier_categories || []).map((sc: { category_id: string }) => sc.category_id) }
    : null;
  return { categories: categories ?? [], supplier };
}
