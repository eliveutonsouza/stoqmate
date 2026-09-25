import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/supabase/env";

// Bypassa RLS inteiramente — só pra Server Components/Route Handlers do
// console de plataforma (/admin/**) DEPOIS de confirmar is_platform_staff()
// com o client normal (server.ts). Nunca importar de features de tenant.
// O import "server-only" acima quebra o build se isto acabar num bundle
// de cliente.
export function createServiceRoleClient() {
  const { url } = supabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY não está definida.");
  return createSupabaseClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
