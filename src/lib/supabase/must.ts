import type { PostgrestError } from "@supabase/supabase-js";

// Leitura que não pode falhar em silêncio. Sem isto, `const { data } = …`
// seguido de `?? []` transformava erro de permissão/rede numa tela vazia —
// o usuário via "nenhum produto" em vez de "algo deu errado".
// Lança com contexto; o error boundary (src/app/error.tsx) mostra a falha.
export function must<T>(result: { data: T; error: PostgrestError | null }, context: string): T {
  if (result.error) {
    throw new Error(`[${context}] ${result.error.message}`);
  }
  return result.data;
}
