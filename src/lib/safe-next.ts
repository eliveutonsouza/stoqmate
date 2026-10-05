// Destino pós-login vindo da URL (?next=): só caminho interno. Checar só
// "começa com / e não com //" não basta — o parser de URL do navegador
// descarta tab/quebra de linha, e `/\t/evil.com` vira `//evil.com` (outro
// site). Rejeita caractere de controle e barra invertida, e confirma com o
// próprio parser que a origem não muda.
const BASE = "https://stoqmate.invalid";

export function safeNext(next: unknown, fallback = "/dashboard"): string {
  if (typeof next !== "string" || next.length > 500) return fallback;
  if ([...next].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 || c === "\\")) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  try {
    const url = new URL(next, BASE);
    if (url.origin !== BASE) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
