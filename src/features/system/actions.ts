"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { scheduleNotificationEmails } from "@/features/network-admin/notification-emails";

export async function requestAccessAction(route: string) {
  // Rota vai pro texto do aviso e do email: só caminho interno, curto.
  if (typeof route !== "string" || !/^\/[a-z0-9/_-]{0,120}$/i.test(route)) return { error: "Tela inválida." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_request_access", { p_route: route });
  if (error) {
    if (error.message.includes("not authorized")) return { error: "Entre na sua conta da loja para pedir acesso." };
    return { error: "Não foi possível enviar o pedido agora. Tente de novo em instantes." };
  }
  scheduleNotificationEmails();
  revalidatePath("/notifications");
  return { ok: true };
}
