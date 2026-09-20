import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Bypassa RLS inteiramente — só pra Server Components/Route Handlers do
// console de plataforma (/admin/**) DEPOIS de confirmar is_platform_staff()
// com o client normal (server.ts). Nunca importar de features de tenant.
// O import "server-only" acima quebra o build se isto acabar num bundle
// de cliente.
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
