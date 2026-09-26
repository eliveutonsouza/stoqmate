"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { userMessage, type DbErrorLike } from "@/lib/errors";

function friendlyError(error: DbErrorLike) {
  const message = error?.message ?? "";
  const known: Record<string, string> = {
    "not authorized": "Seu perfil não tem permissão para essa operação.",
    "informe um nome para a promoção": "Informe um nome para a promoção.",
    "preço promocional precisa ser positivo": "O preço promocional precisa ser positivo.",
    "preço promocional precisa ser menor que o preço original": "O preço promocional precisa ser menor que o preço original.",
    "produto inválido": "Produto inválido.",
    "categoria inválida": "Categoria inválida.",
    "abrangência inválida": "Abrangência inválida.",
    "promoção não encontrada": "Promoção não encontrada.",
  };
  for (const [key, friendly] of Object.entries(known)) {
    if (message.includes(key)) return friendly;
  }
  return userMessage(error, "operations/promotions-actions");
}

export async function createPromotionAction(input: {
  name: string;
  scopeType: "product" | "category" | "store";
  productId: string | null;
  categoryId: string | null;
  promoPrice: number;
  startsAt: string;
  endsAt: string | null;
  untilStock: boolean;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_promotion_create", {
    p_name: input.name,
    p_scope_type: input.scopeType,
    p_product_id: input.productId,
    p_category_id: input.categoryId,
    p_promo_price: input.promoPrice,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
    p_until_stock: input.untilStock,
  });
  if (error) return { error: friendlyError(error) };
  const { error: auditError } = await supabase.rpc("fn_write_audit", {
    p_kind: "promo",
    p_message: `Criou promoção "${input.name}" · preço R$ ${input.promoPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    p_target_type: "promotion",
    p_target_id: data,
  });
  // Auditoria não desfaz a operação já gravada, mas a falha não pode sumir.
  if (auditError) console.error(`[audit] falhou: ${auditError.message}`);
  revalidatePath("/promotions");
  return { id: data as string };
}

export async function setPromotionActiveAction(input: { id: string; active: boolean }) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_promotion_set_active", { p_id: input.id, p_active: input.active });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/promotions");
  revalidatePath("/promotions/edit");
  return { ok: true };
}
