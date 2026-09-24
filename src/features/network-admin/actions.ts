"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { limitKindFromError } from "@/lib/plan-limits";

export async function createStoreAction(input: { name: string; type: string; city: string; cnpj: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_create_store", {
    p_name: input.name, p_type: input.type, p_city: input.city, p_cnpj: input.cnpj,
  });
  if (error) {
    const limit = limitKindFromError(error.message);
    if (limit) redirect(`/limit-reached?kind=${limit}`);
    if (error.message.includes("not authorized")) return { error: "Seu perfil não tem permissão para criar unidades." };
    return { error: error.message };
  }
  revalidatePath("/settings/units");
  return { id: data as string };
}
