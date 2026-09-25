import { createClient } from "@/lib/supabase/server";
import { must } from "@/lib/supabase/must";

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
