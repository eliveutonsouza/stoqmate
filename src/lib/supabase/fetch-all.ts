// O PostgREST devolve no máximo 1000 linhas por chamada (max_rows): lista
// "completa" cortava em silêncio. Busca em páginas até esgotar. A query
// precisa de ordem estável (.order) pra página não repetir nem pular linha.
type Page<T> = { data: T[] | null; error: { message: string } | null };

export async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<Page<T>>, size = 1000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await page(from, from + size - 1);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < size) return out;
  }
}
