"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { loadPricingPreview } from "@/features/analysis/queries";
import { GENERIC_ERROR, userMessage } from "@/lib/errors";

const SCOPES = ["supplier", "category", "brand"] as const;
const MODES = ["cost", "sale", "margin"] as const;
const validScope = (scope: unknown, value: unknown) =>
  SCOPES.includes(scope as (typeof SCOPES)[number]) && typeof value === "string" && value.length > 0 && value.length <= 120;

export async function previewPricingAction(scope: "supplier" | "category" | "brand", scopeValue: string) {
  if (!validScope(scope, scopeValue)) return { error: "Escolha fornecedor, categoria ou marca." };
  try {
    return { rows: await loadPricingPreview(scope, scopeValue) };
  } catch (err) {
    console.error("[analysis/previewPricing]", err);
    return { error: GENERIC_ERROR };
  }
}

export async function bulkPriceUpdateAction(input: {
  scope: "supplier" | "category" | "brand";
  scopeValue: string;
  mode: "cost" | "sale" | "margin";
  pct: number;
  rounding: string;
}) {
  if (!validScope(input.scope, input.scopeValue)) return { error: "Escolha fornecedor, categoria ou marca." };
  if (!MODES.includes(input.mode)) return { error: "Tipo de reajuste inválido." };
  if (typeof input.pct !== "number" || !Number.isFinite(input.pct) || input.pct < -90 || input.pct > 500) return { error: "Percentual fora do limite (-90% a 500%)." };
  if (typeof input.rounding !== "string" || input.rounding.length > 20) return { error: "Arredondamento inválido." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_bulk_price_update", {
    p_scope: input.scope, p_scope_value: input.scopeValue, p_mode: input.mode,
    p_pct: input.pct, p_rounding: input.rounding,
  });
  if (error) {
    if (error.message.includes("not authorized")) return { error: "Seu perfil não tem permissão para reajustar preços." };
    return { error: userMessage(error, "analysis/actions") };
  }
  revalidatePath("/products");
  revalidatePath("/products/detail");
  revalidatePath("/products/pricing");
  return data as { count: number; avg_margin_before: number | null; avg_margin_after: number | null };
}
