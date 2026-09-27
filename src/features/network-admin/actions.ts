"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { limitKindFromError } from "@/lib/plan-limits";
import { userMessage } from "@/lib/errors";
import { formatCnpj, isCnpj, textError } from "@/lib/validation";

export async function createStoreAction(input: { name: string; type: string; city: string; cnpj: string }) {
  const nameError = textError(input.name, "o nome da unidade", 2, 80);
  if (nameError) return { error: nameError };
  if (input.cnpj?.trim() && !isCnpj(input.cnpj)) return { error: "CNPJ inválido — confira os 14 dígitos." };
  if (typeof input.type !== "string" || input.type.length > 40 || (input.city?.length ?? 0) > 80) return { error: "Tipo ou cidade inválidos." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_create_store", {
    p_name: input.name.trim(), p_type: input.type, p_city: input.city, p_cnpj: input.cnpj?.trim() ? formatCnpj(input.cnpj) : "",
  });
  if (error) {
    const limit = limitKindFromError(error.message);
    if (limit) redirect(`/limit-reached?kind=${limit}`);
    if (error.message.includes("not authorized")) return { error: "Seu perfil não tem permissão para criar unidades." };
    return { error: userMessage(error, "network-admin/actions") };
  }
  // Unidade nova entra no seletor de loja do cabeçalho e nas telas de estoque.
  revalidatePath("/", "layout");
  return { id: data as string };
}
