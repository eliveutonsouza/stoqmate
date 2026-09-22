"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { loadPricingPreview } from "@/features/analysis/queries";

export async function previewPricingAction(scope: "supplier" | "category" | "brand", scopeValue: string) {
  return loadPricingPreview(scope, scopeValue);
}

export async function bulkPriceUpdateAction(input: {
  scope: "supplier" | "category" | "brand";
  scopeValue: string;
  mode: "cost" | "sale" | "margin";
  pct: number;
  rounding: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_bulk_price_update", {
    p_scope: input.scope, p_scope_value: input.scopeValue, p_mode: input.mode,
    p_pct: input.pct, p_rounding: input.rounding,
  });
  if (error) {
    if (error.message.includes("not authorized")) return { error: "Seu perfil não tem permissão para reajustar preços." };
    return { error: error.message };
  }
  revalidatePath("/products");
  return data as { count: number; avg_margin_before: number | null; avg_margin_after: number | null };
}
