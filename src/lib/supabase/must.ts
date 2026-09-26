import type { Json } from "@/lib/supabase/database.types";

// Leitura que não pode falhar em silêncio. Sem isto, `const { data } = …`
// seguido de `?? []` transformava erro de permissão/rede numa tela vazia —
// o usuário via "nenhum produto" em vez de "algo deu errado".
// Lança com contexto; o error boundary (src/app/error.tsx) mostra a falha.
//
// RPC que devolve `jsonb` vem tipada como `Json` (união de tudo); as nossas
// devolvem sempre um objeto, então aqui vira objeto indexável.
export type JsonObject = { [key: string]: Json | undefined };
type Data<D> = Json extends D ? JsonObject | null : D;

export function must<R extends { data: unknown; error?: { message: string } | null }>(result: R, context: string): Data<R["data"]> {
  if (result.error) {
    throw new Error(`[${context}] ${result.error.message}`);
  }
  return result.data as Data<R["data"]>;
}
