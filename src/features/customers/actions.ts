"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { userMessage, type DbErrorLike } from "@/lib/errors";

function friendlyError(error: DbErrorLike) {
  const message = error?.message ?? "";
  const known: Record<string, string> = {
    "not authorized": "Seu perfil não tem permissão para essa operação.",
    "informe o nome do cliente": "Informe o nome do cliente.",
    "informe o motivo do ajuste": "Informe o motivo do ajuste de crédito.",
    "cliente não encontrado": "Cliente não encontrado.",
  };
  for (const [key, friendly] of Object.entries(known)) {
    if (message.includes(key)) return friendly;
  }
  return userMessage(error, "customers/actions");
}

export async function createCustomerAction(input: { name: string; doc: string; phone: string; email: string; notes: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_customer_create", {
    p_name: input.name,
    p_doc: input.doc || null,
    p_phone: input.phone || null,
    p_email: input.email || null,
    p_notes: input.notes || null,
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/customers");
  return { id: data as string };
}

export async function adjustCustomerCreditAction(input: { customerId: string; delta: number; reason: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_customer_credit_adjust", {
    p_customer_id: input.customerId,
    p_delta: input.delta,
    p_reason: input.reason,
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/customers");
  revalidatePath("/customers/detail");
  return { balance: data as number };
}
