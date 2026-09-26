"use server";

import { createClient } from "@/lib/supabase/server";

export async function globalSearchAction(term: string) {
  const supabase = await createClient();
  const clean = term.trim();
  if (clean.length < 2) {
    return { products: [], movements: [], suppliers: [], promotions: [], locations: [], error: null };
  }
  // `%`/`_` são curinga do ILIKE; `,().` e aspas quebram a sintaxe do filtro
  // `.or()` do PostgREST (dava pra injetar condição extra). Saem todos.
  const like = `%${clean.replace(/[%_,().:"'\\]/g, "")}%`;

  const results = await Promise.all([
    supabase.rpc("fn_search_products", { p_term: clean, p_limit: 5 }),
    supabase
      .from("stock_movements")
      .select("id, kind, qty, unit_price, created_at, product:products!inner(id, sku, name), store:stores(name)")
      .ilike("product.name", like)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("suppliers").select("id, name, cnpj").ilike("name", like).limit(5),
    supabase.from("promotions").select("id, name, active, promo_price").ilike("name", like).limit(5),
    supabase.from("locations").select("id, code, description").or(`code.ilike.${like},description.ilike.${like}`).limit(5),
  ]);
  const [products, movements, suppliers, promotions, locations] = results;
  const failed = results.find((r) => r.error);

  return {
    products: products.data ?? [],
    movements: movements.data ?? [],
    suppliers: suppliers.data ?? [],
    promotions: promotions.data ?? [],
    locations: locations.data ?? [],
    error: failed ? "Parte da busca falhou. Tente de novo em instantes." : null,
  };
}
