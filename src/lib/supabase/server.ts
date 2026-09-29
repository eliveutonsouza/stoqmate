import type { Database } from "@/lib/supabase/database.types";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/supabase/env";

// Cliente pra Server Components, Server Actions e Route Handlers — respeita
// RLS via a sessão do cookie. Nunca importar em código "use client".
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = supabaseEnv();

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component chamando setAll (ex.: refresh de sessão em
            // middleware) — ignorável quando há middleware renovando a sessão.
          }
        },
      },
    },
  );
}

// Tenant do usuário autenticado — toda inserção em tabela de domínio precisa
// gravar esse valor (RLS só CONFERE tenant_id = auth_tenant_id(), não
// preenche sozinho).
export async function getTenantId(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("auth_tenant_id");
  if (error || !data) throw new Error("Sem tenant associado a esta sessão.");
  return data as string;
}

// Usuário da sessão para LEITURA em Server Component: getClaims() valida o
// JWT localmente (projeto usa chave assimétrica), sem o round trip ao Auth
// server que getUser() faz. Actions que mutam dado sensível seguem com
// getUser() (confere revogação no servidor).
export async function getSessionUser(supabase: SupabaseClient) {
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: (claims.email as string | undefined) ?? "" };
}
