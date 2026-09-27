"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_STORE_COOKIE } from "@/features/shell/queries";
import { isUuid } from "@/lib/validation";

export async function setActiveStoreAction(storeId: string) {
  if (!isUuid(storeId)) return { error: "Unidade não encontrada." };
  const supabase = await createClient();
  // RLS só devolve loja da própria empresa: id de outra rede não passa.
  const { data, error } = await supabase.from("stores").select("id").eq("id", storeId).maybeSingle();
  if (error) return { error: "Não foi possível trocar de unidade agora." };
  if (!data) return { error: "Unidade não encontrada." };

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_STORE_COOKIE, storeId, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
