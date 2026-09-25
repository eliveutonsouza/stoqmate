// Leitura que não pode falhar em silêncio. Sem isto, `const { data } = …`
// seguido de `?? []` transformava erro de permissão/rede numa tela vazia —
// o usuário via "nenhum produto" em vez de "algo deu errado".
// Lança com contexto; o error boundary (src/app/error.tsx) mostra a falha.
export function must<R extends { data: unknown; error?: { message: string } | null }>(result: R, context: string): R["data"] {
  if (result.error) {
    throw new Error(`[${context}] ${result.error.message}`);
  }
  return result.data;
}
