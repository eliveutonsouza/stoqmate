"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function friendlyError(message: string) {
  const known: Record<string, string> = {
    "not authorized": "Seu perfil não tem permissão para essa operação.",
    "quantidade precisa ser positiva": "A quantidade precisa ser maior que zero.",
    "sem divergência — nada para ajustar": "A contagem bate com o sistema — não há o que ajustar.",
    "justificativa precisa ter pelo menos 20 caracteres": "A justificativa precisa ter pelo menos 20 caracteres.",
    "origem e destino não podem ser a mesma loja": "Escolha uma unidade de destino diferente da origem.",
    "informe ao menos um item": "Adicione pelo menos um item.",
    "transferência não encontrada": "Transferência não encontrada.",
    "transferência já conferida": "Esta transferência já foi conferida.",
    "informe ao menos um item contado": "Conte pelo menos um item antes de fechar.",
    "itens devolvido e entregue precisam ser diferentes": "Escolha um item diferente do que foi devolvido.",
  };
  for (const [key, friendly] of Object.entries(known)) {
    if (message.includes(key)) return friendly;
  }
  if (message.includes("saldo insuficiente do item entregue")) return "Saldo insuficiente do item entregue.";
  if (message.includes("saldo insuficiente")) return "Saldo insuficiente na origem para um dos itens.";
  if (message.includes("justificativa precisa ter pelo menos 20 caracteres quando há divergência")) {
    return "Há divergência — a justificativa precisa ter pelo menos 20 caracteres.";
  }
  return message;
}

export async function stockEntryAction(input: {
  storeId: string; productId: string; qty: number; unitCost: number; notes: string; locationId: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_stock_entry", {
    p_store_id: input.storeId, p_product_id: input.productId, p_qty: input.qty,
    p_unit_cost: input.unitCost, p_notes: input.notes || null,
  });
  if (error) return { error: friendlyError(error.message) };
  if (input.locationId) {
    const { error: locError } = await supabase.from("products").update({ default_location_id: input.locationId }).eq("id", input.productId);
    if (locError) return { id: data as string, warning: "Entrada gravada, mas o local padrão do produto não foi atualizado." };
  }
  revalidatePath("/stock/history");
  revalidatePath("/products");
  return { id: data as string };
}

export async function stockAdjustmentAction(input: {
  storeId: string; productId: string; countedQty: number; reason: string; justification: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_stock_adjustment", {
    p_store_id: input.storeId, p_product_id: input.productId, p_counted_qty: input.countedQty,
    p_reason: input.reason, p_justification: input.justification,
  });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/stock/history");
  revalidatePath("/products");
  return { id: data as string };
}

export async function transferDispatchAction(input: {
  originStoreId: string; destinationStoreId: string;
  items: { productId: string; qty: number }[];
  reason: string; carrier: string; notes: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_transfer_dispatch", {
    p_origin_store_id: input.originStoreId, p_destination_store_id: input.destinationStoreId,
    p_items: input.items.map((i) => ({ product_id: i.productId, qty: i.qty })),
    p_reason: input.reason, p_carrier: input.carrier || null, p_notes: input.notes || null,
  });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/stock/history");
  revalidatePath("/products");
  return { id: data as string };
}

export async function transferReceiveAction(input: {
  transferId: string;
  items: { transferItemId: string; qtyReceived: number }[];
  discrepancyReason: string;
  discrepancyDetail: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_transfer_receive", {
    p_transfer_id: input.transferId,
    p_items: input.items.map((i) => ({ transfer_item_id: i.transferItemId, qty_received: i.qtyReceived })),
    p_discrepancy_reason: input.discrepancyReason || null,
    p_discrepancy_detail: input.discrepancyDetail || null,
  });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/stock/history");
  revalidatePath("/stock/transfer");
  revalidatePath("/products");
  return { ok: true };
}

export async function stockExchangeAction(input: {
  storeId: string; returnedProductId: string; deliveredProductId: string;
  qty: number; reason: string; notes: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_stock_exchange", {
    p_store_id: input.storeId, p_returned_product_id: input.returnedProductId,
    p_delivered_product_id: input.deliveredProductId, p_qty: input.qty,
    p_reason: input.reason, p_notes: input.notes || null,
  });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/stock/history");
  revalidatePath("/products");
  return { id: data as string };
}

export async function stockReturnAction(input: {
  storeId: string; productId: string; qty: number; reason: string; restock: boolean; notes: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_stock_return", {
    p_store_id: input.storeId, p_product_id: input.productId, p_qty: input.qty,
    p_reason: input.reason, p_restock: input.restock, p_notes: input.notes || null,
  });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/stock/history");
  revalidatePath("/products");
  return { id: data as string };
}

export async function stockCountSubmitAction(input: {
  storeId: string; locationId: string | null; categoryId: string | null;
  items: { productId: string; countedQty: number }[];
  reason: string; justification: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_stock_count_submit", {
    p_store_id: input.storeId, p_location_id: input.locationId, p_category_id: input.categoryId,
    p_items: input.items.map((i) => ({ product_id: i.productId, counted_qty: i.countedQty })),
    p_reason: input.reason || null, p_justification: input.justification || null,
  });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/stock/history");
  revalidatePath("/products");
  return { id: data as string };
}
