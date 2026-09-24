import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Anon, sem cookies: para dado público (planos, duração do trial) em páginas
// que precisam continuar cacheáveis — o client de server.ts lê cookies() e
// tornaria a rota dinâmica. Só enxerga o que o RLS libera pro papel anon.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
