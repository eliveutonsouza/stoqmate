import { createClient } from "@/lib/supabase/server";

export async function loadReplenishmentSuggestions(storeId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("fn_replenishment_suggestions", { p_store_id: storeId });
  return data ?? [];
}

export async function loadOpenPurchaseOrders() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchase_orders")
    .select(`
      id, status, freight, notes, created_at, received_at,
      store:stores(id, name),
      supplier:suppliers(id, name),
      purchase_order_items(id, qty_ordered, qty_received, unit_cost, product:products(id, sku, name))
    `)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function loadPurchaseOrder(orderId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchase_orders")
    .select(`
      id, status, freight, notes, created_at, received_at,
      store:stores(id, name),
      supplier:suppliers(id, name, lead_time_days, min_order_value),
      purchase_order_items(id, qty_ordered, qty_received, unit_cost, product:products(id, sku, name, brand, attrs, category:categories(id, name, code, icon, color)))
    `)
    .eq("id", orderId)
    .maybeSingle();
  return data ?? null;
}
