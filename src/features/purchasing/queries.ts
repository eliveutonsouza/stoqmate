import { createClient } from "@/lib/supabase/server";
import { must } from "@/lib/supabase/must";
import { loadStores } from "@/features/stock/queries";

export async function loadReplenishmentSuggestions(storeId: string) {
  const supabase = await createClient();
  const data = must(await supabase.rpc("fn_replenishment_suggestions", { p_store_id: storeId }), "purchasing/queries.loadReplenishmentSuggestions.data");
  return data ?? [];
}

export async function loadOpenPurchaseOrders() {
  const supabase = await createClient();
  const data = must(await supabase
    .from("purchase_orders")
    .select(`
      id, status, freight, notes, created_at, received_at,
      store:stores(id, name),
      supplier:suppliers(id, name),
      purchase_order_items(id, qty_ordered, qty_received, unit_cost, product:products(id, sku, name))
    `)
    .order("created_at", { ascending: false }), "purchasing/queries.loadOpenPurchaseOrders.data");
  return data ?? [];
}

export async function loadPurchaseOrder(orderId: string) {
  const supabase = await createClient();
  const data = must(await supabase
    .from("purchase_orders")
    .select(`
      id, status, freight, notes, created_at, received_at,
      store:stores(id, name),
      supplier:suppliers(id, name, lead_time_days, min_order_value),
      purchase_order_items(id, qty_ordered, qty_received, unit_cost, product:products(id, sku, name, brand, attrs, category:categories(id, name, code, icon, color)))
    `)
    .eq("id", orderId)
    .maybeSingle(), "purchasing/queries.loadPurchaseOrder.data");
  return data ?? null;
}

// Tela de novo pedido: `prefill` vem da reposição ("productId:qty,...").
export async function loadPurchaseOrderNew(params: { store?: string; supplier?: string; prefill?: string }) {
  const supabase = await createClient();
  const stores = await loadStores();
  const storeId = stores.some((s) => s.id === params.store) ? params.store! : stores[0]?.id ?? "";
  const [suggestions, suppliersRes] = await Promise.all([
    storeId ? loadReplenishmentSuggestions(storeId) : Promise.resolve([]),
    supabase.from("suppliers").select("id, name, lead_time_days, min_order_value").eq("active", true).order("name"),
  ]);
  const suppliers = must(suppliersRes, "purchasing.new.suppliers") ?? [];

  const qtyOverrides: Record<string, number> = {};
  for (const pair of (params.prefill ?? "").split(",")) {
    const [productId, qty] = pair.split(":");
    const n = parseInt(qty ?? "", 10);
    if (productId && Number.isFinite(n) && n > 0) qtyOverrides[productId] = n;
  }

  const supplierId = suppliers.some((s) => s.id === params.supplier) ? params.supplier! : suppliers[0]?.id ?? "";
  return { stores, storeId, suppliers, supplierId, suggestions, qtyOverrides };
}
