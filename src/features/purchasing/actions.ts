"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function friendlyError(message: string) {
  const known: Record<string, string> = {
    "not authorized": "Seu perfil não tem permissão para essa operação.",
    "informe ao menos um item": "Adicione pelo menos um item ao pedido.",
    "loja inválida": "Unidade inválida.",
    "fornecedor inválido": "Fornecedor inválido.",
    "produto inválido": "Produto inválido.",
    "pedido não encontrado": "Pedido não encontrado.",
    "pedido já recebido": "Este pedido já foi recebido.",
  };
  for (const [key, friendly] of Object.entries(known)) {
    if (message.includes(key)) return friendly;
  }
  return message;
}

export async function createPurchaseOrderAction(input: {
  storeId: string;
  supplierId: string;
  items: { productId: string; qty: number }[];
  notes: string;
  freight: number;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_purchase_order_create", {
    p_store_id: input.storeId,
    p_supplier_id: input.supplierId,
    p_items: input.items.map((i) => ({ product_id: i.productId, qty: i.qty })),
    p_notes: input.notes || null,
    p_freight: input.freight,
  });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/purchase-orders");
  return { id: data as string };
}

export async function receivePurchaseOrderAction(input: {
  orderId: string;
  items: { orderItemId: string; qtyReceived: number }[];
}) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_purchase_order_receive", {
    p_order_id: input.orderId,
    p_items: input.items.map((i) => ({ order_item_id: i.orderItemId, qty_received: i.qtyReceived })),
  });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/purchase-orders");
  revalidatePath("/stock/history");
  revalidatePath("/products");
  return { ok: true };
}
