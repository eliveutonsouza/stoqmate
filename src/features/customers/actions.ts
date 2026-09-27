"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { userMessage, type DbErrorLike } from "@/lib/errors";
import { isEmail, isUuid, textError } from "@/lib/validation";

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
  const nameError = textError(input.name, "o nome do cliente", 2, 120);
  if (nameError) return { error: nameError };
  if (input.email?.trim() && !isEmail(input.email)) return { error: "Email inválido." };
  if ((input.doc?.length ?? 0) > 20 || (input.phone?.length ?? 0) > 30) return { error: "Documento ou telefone longo demais." };
  if ((input.notes?.length ?? 0) > 1000) return { error: "Observações longas demais (máximo 1.000 caracteres)." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_customer_create", {
    p_name: input.name.trim(),
    p_doc: input.doc?.trim() || null,
    p_phone: input.phone?.trim() || null,
    p_email: input.email?.trim() || null,
    p_notes: input.notes?.trim() || null,
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/customers");
  return { id: data as string };
}

export async function adjustCustomerCreditAction(input: { customerId: string; delta: number; reason: string }) {
  if (!isUuid(input.customerId)) return { error: "Cliente não encontrado." };
  if (typeof input.delta !== "number" || !Number.isFinite(input.delta) || input.delta === 0 || Math.abs(input.delta) > 1_000_000) return { error: "Informe um valor diferente de zero." };
  const reasonError = textError(input.reason, "o motivo do ajuste", 3, 200);
  if (reasonError) return { error: reasonError };
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
