"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { userMessage, type DbErrorLike } from "@/lib/errors";
import { scheduleNotificationEmails } from "@/features/network-admin/notification-emails";
import { paymentFriendlyError, sanitizePayments, type PaymentInput } from "@/lib/payment-errors";
import { allUuids, isUuid } from "@/lib/validation";

// O banco refaz as regras (saldo, tenant, permissão); aqui barra o lixo
// antes: id que não é uuid, quantidade quebrada, lista gigante.
const isQty = (n: unknown): n is number => Number.isInteger(n) && (n as number) > 0 && (n as number) <= 1_000_000;
const isCount = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 1_000_000;
const MAX_ITEMS = 500;
const tooLong = (v: unknown, max: number) => typeof v === "string" && v.length > max;

function friendlyError(error: DbErrorLike) {
  const message = error?.message ?? "";
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
    "item repetido na conferência": "O mesmo item apareceu duas vezes na conferência. Recarregue a tela e confira de novo.",
  };
  for (const [key, friendly] of Object.entries(known)) {
    if (message.includes(key)) return friendly;
  }
  if (message.includes("saldo insuficiente do item entregue")) return "Saldo insuficiente do item entregue.";
  if (message.includes("saldo insuficiente")) return "Saldo insuficiente na origem para um dos itens.";
  if (message.includes("justificativa precisa ter pelo menos 20 caracteres quando há divergência")) {
    return "Há divergência — a justificativa precisa ter pelo menos 20 caracteres.";
  }
  return paymentFriendlyError(message) ?? userMessage(error, "stock/actions");
}

export async function stockEntryAction(input: {
  storeId: string; productId: string; qty: number; unitCost: number; notes: string; locationId: string;
}) {
  if (!isUuid(input.storeId) || !isUuid(input.productId)) return { error: "Selecione a unidade e o produto." };
  if (input.locationId && !isUuid(input.locationId)) return { error: "Local inválido." };
  if (!isQty(input.qty)) return { error: "A quantidade precisa ser um número inteiro maior que zero." };
  if (typeof input.unitCost !== "number" || !Number.isFinite(input.unitCost) || input.unitCost < 0) return { error: "Custo unitário inválido." };
  if (tooLong(input.notes, 1000)) return { error: "Observações longas demais (máximo 1.000 caracteres)." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_stock_entry", {
    p_store_id: input.storeId, p_product_id: input.productId, p_qty: input.qty,
    p_unit_cost: input.unitCost, p_notes: input.notes || null,
  });
  if (error) return { error: friendlyError(error) };
  scheduleNotificationEmails();
  if (input.locationId) {
    const { data: moved, error: locError } = await supabase.from("products").update({ default_location_id: input.locationId }).eq("id", input.productId).select("id");
    if (locError || !moved?.length) return { id: data as string, warning: "Entrada gravada, mas o local padrão do produto não foi atualizado." };
  }
  revalidatePath("/stock/history");
  revalidatePath("/products");
  revalidatePath("/products/detail");
  return { id: data as string };
}

export async function stockAdjustmentAction(input: {
  storeId: string; productId: string; countedQty: number; reason: string; justification: string;
}) {
  if (!isUuid(input.storeId) || !isUuid(input.productId)) return { error: "Selecione a unidade e o produto." };
  if (!isCount(input.countedQty)) return { error: "Quantidade contada inválida." };
  if (tooLong(input.reason, 120) || tooLong(input.justification, 1000)) return { error: "Texto longo demais." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_stock_adjustment", {
    p_store_id: input.storeId, p_product_id: input.productId, p_counted_qty: input.countedQty,
    p_reason: input.reason, p_justification: input.justification,
  });
  if (error) return { error: friendlyError(error) };
  scheduleNotificationEmails();
  revalidatePath("/stock/history");
  revalidatePath("/products");
  return { id: data as string };
}

export async function transferDispatchAction(input: {
  originStoreId: string; destinationStoreId: string;
  items: { productId: string; qty: number }[];
  reason: string; carrier: string; notes: string;
}) {
  if (!isUuid(input.originStoreId) || !isUuid(input.destinationStoreId)) return { error: "Selecione a origem e o destino." };
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > MAX_ITEMS
    || !allUuids(input.items.map((i) => i?.productId)) || !input.items.every((i) => isQty(i.qty))) {
    return { error: "Itens da transferência inválidos." };
  }
  if (tooLong(input.reason, 120) || tooLong(input.carrier, 120) || tooLong(input.notes, 1000)) return { error: "Texto longo demais." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_transfer_dispatch", {
    p_origin_store_id: input.originStoreId, p_destination_store_id: input.destinationStoreId,
    p_items: input.items.map((i) => ({ product_id: i.productId, qty: i.qty })),
    p_reason: input.reason, p_carrier: input.carrier || null, p_notes: input.notes || null,
  });
  if (error) return { error: friendlyError(error) };
  scheduleNotificationEmails();
  revalidatePath("/stock/history");
  revalidatePath("/stock/transfer");
  revalidatePath("/stock/transfer/receive");
  revalidatePath("/products");
  return { id: data as string };
}

export async function transferReceiveAction(input: {
  transferId: string;
  items: { transferItemId: string; qtyReceived: number }[];
  discrepancyReason: string;
  discrepancyDetail: string;
}) {
  if (!isUuid(input.transferId)) return { error: "Transferência não encontrada." };
  if (!Array.isArray(input.items) || input.items.length > MAX_ITEMS
    || !allUuids(input.items.map((i) => i?.transferItemId)) || !input.items.every((i) => isCount(i.qtyReceived))) {
    return { error: "Itens da conferência inválidos." };
  }
  if (tooLong(input.discrepancyReason, 120) || tooLong(input.discrepancyDetail, 1000)) return { error: "Texto longo demais." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_transfer_receive", {
    p_transfer_id: input.transferId,
    p_items: input.items.map((i) => ({ transfer_item_id: i.transferItemId, qty_received: i.qtyReceived })),
    p_discrepancy_reason: input.discrepancyReason || null,
    p_discrepancy_detail: input.discrepancyDetail || null,
  });
  if (error) return { error: friendlyError(error) };
  scheduleNotificationEmails();
  revalidatePath("/stock/history");
  revalidatePath("/stock/transfer");
  revalidatePath("/stock/transfer/receive");
  revalidatePath("/products");
  return { ok: true };
}

// Acerto da diferença (opcional): o banco calcula a diferença com o preço
// vigente — positiva o cliente paga (payments = como pagou), negativa a loja
// devolve (payments = como devolveu; vazio = sem devolução de valor).
export async function stockExchangeAction(input: {
  storeId: string; returnedProductId: string; deliveredProductId: string;
  qty: number; reason: string; notes: string;
  customerId?: string | null; payments?: PaymentInput[];
}) {
  if (!isUuid(input.storeId) || !isUuid(input.returnedProductId) || !isUuid(input.deliveredProductId)) return { error: "Selecione a unidade e os dois itens." };
  if (!isQty(input.qty)) return { error: "A quantidade precisa ser um número inteiro maior que zero." };
  if (input.customerId && !isUuid(input.customerId)) return { error: "Cliente inválido." };
  if (tooLong(input.reason, 120) || tooLong(input.notes, 1000)) return { error: "Texto longo demais." };
  const payments = sanitizePayments(input.payments);
  if (!payments) return { error: "Formas de pagamento inválidas." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_stock_exchange", {
    p_store_id: input.storeId, p_returned_product_id: input.returnedProductId,
    p_delivered_product_id: input.deliveredProductId, p_qty: input.qty,
    p_reason: input.reason, p_notes: input.notes || null,
    p_customer_id: input.customerId ?? null, p_payments: payments,
  });
  if (error) return { error: friendlyError(error) };
  scheduleNotificationEmails();
  revalidatePath("/stock/history");
  revalidatePath("/products");
  revalidatePath("/cash");
  revalidatePath("/customers");
  revalidatePath("/customers/detail");
  return { id: data as string };
}

// Estorno opcional: payments = como o valor volta ao cliente (dinheiro do
// caixa, PIX, crédito da loja, outro); vazio = devolve só o estoque.
export async function stockReturnAction(input: {
  storeId: string; productId: string; qty: number; reason: string; restock: boolean; notes: string;
  customerId?: string | null; payments?: PaymentInput[];
}) {
  if (!isUuid(input.storeId) || !isUuid(input.productId)) return { error: "Selecione a unidade e o produto." };
  if (!isQty(input.qty) || typeof input.restock !== "boolean") return { error: "A quantidade precisa ser um número inteiro maior que zero." };
  if (input.customerId && !isUuid(input.customerId)) return { error: "Cliente inválido." };
  if (tooLong(input.reason, 120) || tooLong(input.notes, 1000)) return { error: "Texto longo demais." };
  const payments = sanitizePayments(input.payments);
  if (!payments) return { error: "Formas de devolução inválidas." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_stock_return", {
    p_store_id: input.storeId, p_product_id: input.productId, p_qty: input.qty,
    p_reason: input.reason, p_restock: input.restock, p_notes: input.notes || null,
    p_customer_id: input.customerId ?? null, p_payments: payments,
  });
  if (error) return { error: friendlyError(error) };
  scheduleNotificationEmails();
  revalidatePath("/stock/history");
  revalidatePath("/products");
  revalidatePath("/cash");
  revalidatePath("/customers");
  revalidatePath("/customers/detail");
  return { id: data as string };
}

export async function stockCountSubmitAction(input: {
  storeId: string; locationId: string | null; categoryId: string | null;
  items: { productId: string; countedQty: number }[];
  reason: string; justification: string;
}) {
  if (!isUuid(input.storeId)) return { error: "Selecione a unidade." };
  if ((input.locationId && !isUuid(input.locationId)) || (input.categoryId && !isUuid(input.categoryId))) return { error: "Filtro da contagem inválido." };
  if (!Array.isArray(input.items) || input.items.length > 5000
    || !allUuids(input.items.map((i) => i?.productId)) || !input.items.every((i) => isCount(i.countedQty))) {
    return { error: "Itens da contagem inválidos." };
  }
  if (tooLong(input.reason, 120) || tooLong(input.justification, 1000)) return { error: "Texto longo demais." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_stock_count_submit", {
    p_store_id: input.storeId, p_location_id: input.locationId, p_category_id: input.categoryId,
    p_items: input.items.map((i) => ({ product_id: i.productId, counted_qty: i.countedQty })),
    p_reason: input.reason || null, p_justification: input.justification || null,
  });
  if (error) return { error: friendlyError(error) };
  scheduleNotificationEmails();
  revalidatePath("/stock/history");
  revalidatePath("/products");
  return { id: data as string };
}
