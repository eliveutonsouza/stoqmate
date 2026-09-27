"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { userMessage, type DbErrorLike } from "@/lib/errors";
import { allUuids, isUuid } from "@/lib/validation";
import { scheduleNotificationEmails } from "@/features/network-admin/notification-emails";

const isMoney = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 10_000_000;

function friendlyError(error: DbErrorLike) {
  const message = error?.message ?? "";
  const known: Record<string, string> = {
    "not authorized": "Seu perfil não tem permissão para essa operação.",
    "informe ao menos um item": "Adicione pelo menos um item ao pedido.",
    "loja inválida": "Unidade inválida.",
    "fornecedor inválido": "Fornecedor inválido.",
    "produto inválido": "Produto inválido.",
    "pedido não encontrado": "Pedido não encontrado.",
    "pedido já recebido": "Este pedido já foi recebido.",
    "item repetido na conferência": "O mesmo item apareceu duas vezes no recebimento. Recarregue a tela e confira de novo.",
  };
  for (const [key, friendly] of Object.entries(known)) {
    if (message.includes(key)) return friendly;
  }
  return userMessage(error, "purchasing/actions");
}

export async function createPurchaseOrderAction(input: {
  storeId: string;
  supplierId: string;
  items: { productId: string; qty: number }[];
  notes: string;
  freight: number;
}) {
  if (!isUuid(input.storeId) || !isUuid(input.supplierId)) return { error: "Selecione a unidade e o fornecedor." };
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 500
    || !allUuids(input.items.map((i) => i?.productId)) || !input.items.every((i) => Number.isInteger(i.qty) && i.qty > 0 && i.qty <= 1_000_000)) {
    return { error: "Itens do pedido inválidos." };
  }
  if (!isMoney(input.freight)) return { error: "Frete inválido." };
  if (typeof input.notes === "string" && input.notes.length > 1000) return { error: "Observações longas demais (máximo 1.000 caracteres)." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_purchase_order_create", {
    p_store_id: input.storeId,
    p_supplier_id: input.supplierId,
    p_items: input.items.map((i) => ({ product_id: i.productId, qty: i.qty })),
    p_notes: input.notes || null,
    p_freight: input.freight,
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/purchase-orders");
  revalidatePath("/purchase-orders/detail");
  return { id: data as string };
}

export async function receivePurchaseOrderAction(input: {
  orderId: string;
  items: { orderItemId: string; qtyReceived: number; unitCost?: number }[];
}) {
  if (!isUuid(input.orderId)) return { error: "Pedido não encontrado." };
  if (!Array.isArray(input.items) || input.items.length > 500
    || !allUuids(input.items.map((i) => i?.orderItemId))
    || !input.items.every((i) => Number.isInteger(i.qtyReceived) && i.qtyReceived >= 0 && i.qtyReceived <= 1_000_000
      && (i.unitCost == null || isMoney(i.unitCost)))) {
    return { error: "Itens do recebimento inválidos." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_purchase_order_receive", {
    p_order_id: input.orderId,
    p_items: input.items.map((i) => ({
      order_item_id: i.orderItemId, qty_received: i.qtyReceived,
      ...(i.unitCost != null ? { unit_cost: i.unitCost } : {}),
    })),
  });
  if (error) return { error: friendlyError(error) };
  scheduleNotificationEmails();
  revalidatePath("/purchase-orders");
  revalidatePath("/purchase-orders/detail");
  revalidatePath("/stock/history");
  revalidatePath("/products");
  return { ok: true };
}
