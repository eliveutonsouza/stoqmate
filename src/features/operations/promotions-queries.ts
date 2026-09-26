import { createClient } from "@/lib/supabase/server";
import { must } from "@/lib/supabase/must";
import { productCostMap } from "@/lib/supabase/costs";

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
      product:products(id, sku, name, sale_price, category:categories(id, name, code, icon, color)),
      category:categories(id, name, code, icon, color)
    `)
    .eq("id", id)
    .maybeSingle(), "operations/promotions-queries.loadPromotion.data");
  if (!data) return null;
  const product = data.product as unknown as { id: string } | null;
  if (!product) return data;
  const costById = await productCostMap(supabase, [product.id]);
  return { ...data, product: { ...product, cost_price: costById.get(product.id) ?? null } };
}

export async function loadPromotionFormCategories() {
  const supabase = await createClient();
  return must(await supabase.from("categories").select("id, name, code, icon, color").order("name"), "promotions.form.categories") ?? [];
}
