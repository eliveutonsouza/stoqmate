import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Cliente pra Server Components, Server Actions e Route Handlers — respeita
// RLS via a sessão do cookie. Nunca importar em código "use client".
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
