import { createClient } from "@/lib/supabase/server";

// Perfil atual para a tela de acesso negado. Falha aqui não pode virar outra
// tela de erro em cima da de acesso negado: sem perfil, a tela diz o genérico.
export async function loadCurrentRole() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("auth_role");
  if (error) console.error(`[access-denied] auth_role: ${error.message}`);
  return (data as string | null) ?? null;
}
