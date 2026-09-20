import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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
