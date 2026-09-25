import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/supabase/env";

// Anon, sem cookies: para dado público (planos, duração do trial) em páginas
// que precisam continuar cacheáveis — o client de server.ts lê cookies() e
// tornaria a rota dinâmica. Só enxerga o que o RLS libera pro papel anon.
export function createPublicClient() {
  const { url, anonKey } = supabaseEnv();
  return createSupabaseClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
