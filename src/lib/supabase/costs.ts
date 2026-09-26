import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { must } from "@/lib/supabase/must";

// Custo não é lido direto das tabelas: a coluna products.cost_price e
// stock_movements.unit_cost são fechadas pra leitura (migration
// 20260926120000_cost_visibility). Quem tem a área "money" recebe o custo
// por estas funções; os demais (vendedor) recebem null.

type Client = SupabaseClient<Database>;

// Lotes de 500 ids: exportação de catálogo inteiro não vira um único
// request gigante.
function chunks(ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  const out: string[][] = [];
  for (let i = 0; i < unique.length; i += 500) out.push(unique.slice(i, i + 500));
  return out;
}

export async function productCostMap(supabase: Client, productIds: (string | null | undefined)[]) {
  const map = new Map<string, number>();
  for (const ids of chunks(productIds)) {
    const rows = must(await supabase.rpc("fn_product_costs", { p_product_ids: ids }), "costs.productCostMap") ?? [];
    for (const r of rows) map.set(r.product_id as string, Number(r.cost_price));
  }
  return map;
}

export async function movementCostMap(supabase: Client, movementIds: (string | null | undefined)[]) {
  const map = new Map<string, number | null>();
  for (const ids of chunks(movementIds)) {
    const rows = must(await supabase.rpc("fn_movement_costs", { p_movement_ids: ids }), "costs.movementCostMap") ?? [];
    for (const r of rows) map.set(r.movement_id as string, r.unit_cost == null ? null : Number(r.unit_cost));
  }
  return map;
}
