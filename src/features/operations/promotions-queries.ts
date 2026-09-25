import { createClient } from "@/lib/supabase/server";
import { must } from "@/lib/supabase/must";

export async function loadPromotions() {
  const supabase = await createClient();
  const data = must(await supabase
    .from("promotions")
    .select(`
      id, name, scope_type, promo_price, starts_at, ends_at, until_stock, active, created_at,
      product:products(id, sku, name, sale_price, category:categories(id, name, code, icon, color)),
      category:categories(id, name, code, icon, color)
    `)
    .order("created_at", { ascending: false }), "operations/promotions-queries.loadPromotions.data");
  return data ?? [];
}

export async function loadPromotion(id: string) {
  const supabase = await createClient();
  const data = must(await supabase
    .from("promotions")
    .select(`
      id, name, scope_type, promo_price, starts_at, ends_at, until_stock, active, created_at,
      product:products(id, sku, name, sale_price, cost_price, category:categories(id, name, code, icon, color)),
      category:categories(id, name, code, icon, color)
    `)
    .eq("id", id)
    .maybeSingle(), "operations/promotions-queries.loadPromotion.data");
  return data ?? null;
}
