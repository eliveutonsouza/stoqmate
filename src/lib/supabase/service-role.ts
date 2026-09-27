import type { Database } from "@/lib/supabase/database.types";
import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/supabase/env";

// Bypassa RLS inteiramente — só pra Server Components/Route Handlers do
// console de plataforma (/admin/**) DEPOIS de confirmar is_platform_staff()
// com o client normal (server.ts). Em features de tenant, só pras RPCs de
// servidor (`*_for`/`*_svc`: estorno/log de IA, fila de emails) com tenant
// e usuário já resolvidos pela sessão — nunca pra ler ou gravar tabela.
// O import "server-only" acima quebra o build se isto acabar num bundle
// de cliente.
export function createServiceRoleClient() {
  const { url } = supabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY não está definida.");
  return createSupabaseClient<Database>(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
