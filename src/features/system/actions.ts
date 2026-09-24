"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function requestAccessAction(route: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_request_access", { p_route: route });
  if (error) {
    if (error.message.includes("not authorized")) return { error: "Entre na sua conta da loja para pedir acesso." };
    return { error: "Não foi possível enviar o pedido agora. Tente de novo em instantes." };
  }
  revalidatePath("/notifications");
  return { ok: true };
}
