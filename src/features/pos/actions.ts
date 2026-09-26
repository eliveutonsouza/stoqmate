"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { userMessage, type DbErrorLike } from "@/lib/errors";

function friendlyError(error: DbErrorLike) {
  const message = error?.message ?? "";
  const known: Record<string, string> = {
    "not authorized": "Seu perfil não tem permissão para essa operação.",
    "já existe um caixa aberto nesta unidade": "Já existe um caixa aberto nesta unidade.",
    "sessão de caixa não encontrada ou já fechada": "Sessão de caixa não encontrada ou já fechada.",
    "informe ao menos um item": "Adicione pelo menos um item ao carrinho.",
  };
  for (const [key, friendly] of Object.entries(known)) {
    if (message.includes(key)) return friendly;
  }
  if (message.includes("saldo insuficiente")) return "Saldo insuficiente para um dos itens do carrinho.";
  if (message.includes("detalhe a divergência")) return "Há diferença no caixa — detalhe em pelo menos 10 caracteres.";
  return userMessage(error, "pos/actions");
}

export async function confirmSaleAction(input: {
  storeId: string;
  customerId: string | null;
  paymentMethod: string;
  installments: number;
  cashSessionId: string | null;
  notes: string;
  items: { productId: string; qty: number; unitPrice: number; discountPct: number }[];
  orderDiscountAmount: number;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_confirm_sale", {
    p_store_id: input.storeId,
    p_customer_id: input.customerId,
    p_payment_method: input.paymentMethod,
    p_installments: input.installments,
    p_cash_session_id: input.cashSessionId,
    p_notes: input.notes || null,
    p_items: input.items.map((i) => ({ product_id: i.productId, qty: i.qty, unit_price: i.unitPrice, discount_pct: i.discountPct })),
    p_order_discount_amount: input.orderDiscountAmount,
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/stock/history");
  revalidatePath("/products");
  revalidatePath("/cash");
  return { id: data as string };
}

export async function cashSessionOpenAction(input: { storeId: string; openingAmount: number }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_cash_session_open", {
    p_store_id: input.storeId, p_opening_amount: input.openingAmount,
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/cash");
  return { id: data as string };
}

export async function cashSessionMovementAction(input: { sessionId: string; kind: "supply" | "withdraw"; amount: number; note: string }) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_cash_session_movement", {
    p_session_id: input.sessionId, p_kind: input.kind, p_amount: input.amount, p_note: input.note || null,
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/cash");
  return { ok: true };
}

export async function cashSessionCloseAction(input: {
  sessionId: string; countedAmount: number; discrepancyReason: string; discrepancyDetail: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_cash_session_close", {
    p_session_id: input.sessionId, p_counted_amount: input.countedAmount,
    p_discrepancy_reason: input.discrepancyReason || null, p_discrepancy_detail: input.discrepancyDetail || null,
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/cash");
  return { ok: true };
}
