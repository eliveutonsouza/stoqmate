// Leitura dos searchParams de listas paginadas (?q=…&page=2&…).
// O page.tsx recebe `searchParams` (Promise no Next 16), resolve e passa
// o objeto pra cá; o loader filtra e pagina no servidor.

export const PAGE_SIZE = 50;

export type RawSearchParams = Record<string, string | string[] | undefined>;

// Primeiro valor de um parâmetro, sem espaços nas pontas; vazio vira null.
export function param(sp: RawSearchParams, key: string): string | null {
  const raw = sp[key];
  const v = Array.isArray(raw) ? raw[0] : raw;
  const t = (v ?? "").trim();
  return t === "" ? null : t.slice(0, 200);
}

// Parâmetro restrito a uma lista de valores aceitos (lixo na URL vira null).
export function oneOf<T extends string>(sp: RawSearchParams, key: string, allowed: readonly T[]): T | null {
  const v = param(sp, key);
  return v && (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function uuidParam(sp: RawSearchParams, key: string): string | null {
  const v = param(sp, key);
  return v && UUID_RE.test(v) ? v : null;
}

export function pageParam(sp: RawSearchParams): number {
  const n = Number.parseInt(param(sp, "page") ?? "1", 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 100000) : 1;
}

export function pageRange(page: number, size = PAGE_SIZE) {
  const from = (page - 1) * size;
  return { from, to: from + size - 1, offset: from, limit: size };
}

// Padrão de `.ilike(coluna, padrão)` pra busca "contém": escapa os curingas
// do LIKE (% e _) e a barra, pra o texto digitado ser literal. Só pra
// `.ilike()` de UMA coluna — nunca montar string de `.or()` com texto do
// usuário (PostgREST filter injection); busca em várias colunas vai por RPC.
export function containsPattern(term: string) {
  return `%${term.replace(/[\\%_]/g, (c) => "\\" + c)}%`;
}
