import { createClient } from "@/lib/supabase/server";
import { must } from "@/lib/supabase/must";
import { isUuid } from "@/lib/validation";
import { loadStores } from "@/features/stock/queries";

// Dados das telas de movimentação (antes consultados dentro do page.tsx,
// com erro engolido em `?? []`).

export async function loadStockSaleScreen() {
  const supabase = await createClient();
  const [stores, sessionsRes] = await Promise.all([
    loadStores(),
    supabase.from("cash_sessions").select("id, store_id").eq("status", "open"),
  ]);
  const sessions = must(sessionsRes, "stock.sale.cashSessions") ?? [];
  return { stores, cashSessionByStore: Object.fromEntries(sessions.map((s) => [s.store_id, s.id])) };
}

export async function loadStockEntryScreen() {
  const supabase = await createClient();
  const [stores, suppliersRes, locationsRes] = await Promise.all([
    loadStores(),
    supabase.from("suppliers").select("id, name").eq("active", true).order("name"),
    supabase.from("locations").select("id, code").order("code"),
  ]);
  return {
    stores,
    suppliers: must(suppliersRes, "stock.entry.suppliers") ?? [],
    locations: must(locationsRes, "stock.entry.locations") ?? [],
  };
}

export async function loadStockCountScreen() {
  const supabase = await createClient();
  const [stores, locationsRes, categoriesRes] = await Promise.all([
    loadStores(),
    supabase.from("locations").select("id, code, store_id").order("code"),
    supabase.from("categories").select("id, name").order("name"),
  ]);
  return {
    stores,
    locations: must(locationsRes, "stock.count.locations") ?? [],
    categories: must(categoriesRes, "stock.count.categories") ?? [],
  };
}

// Transferências despachadas aguardando conferência. Sem ?id, a mais antiga
// (fila); com ?id, a escolhida — desde que ainda esteja pendente.
export async function loadTransferToReceive(id?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("transfers")
    .select(`
      id, reason, carrier, shipped_at,
      origin:stores!transfers_origin_store_id_fkey(id, name),
      destination:stores!transfers_destination_store_id_fkey(id, name),
      transfer_items(id, qty_sent, qty_received, product:products(id, sku, name, attrs, category:categories(id, name, code, icon, color)))
    `)
    .eq("status", "dispatched");
  if (id) query = query.eq("id", id);
  const [transferRes, pendingRes] = await Promise.all([
    query.order("shipped_at", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("transfers").select("id", { count: "exact", head: true }).eq("status", "dispatched"),
  ]);
  must(pendingRes, "stock.receive.pending");
  return { transfer: must(transferRes, "stock.receive.transfer") ?? null, pendingCount: pendingRes.count ?? 0 };
}

// Produto pré-selecionado quando a tela vem do detalhe do produto
// (?product=<id>). Mesmo formato do ProductPicker (fn_search_products:
// saldos por loja, preço efetivo, custo só pra quem vê).
export async function loadMovementProduct(productId?: string) {
  if (!isUuid(productId)) return null;
  const supabase = await createClient();
  const base = must(await supabase.from("products").select("id, sku").eq("id", productId).maybeSingle(), "stock.movementProduct.base");
  if (!base) return null;
  const rows = must(await supabase.rpc("fn_search_products", { p_term: base.sku, p_limit: 20 }), "stock.movementProduct.search") ?? [];
  return rows.find((r) => r.id === base.id) ?? null;
}
