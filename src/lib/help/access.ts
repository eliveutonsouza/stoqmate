import { can } from "@/lib/permissions";
import type { HelpArticle, HelpModule, HelpModuleId } from "./types";

// Quem vê o quê na central de ajuda. Não existe regra própria aqui: um artigo
// aparece para o perfil que alcança as telas que ele ensina, pela mesma
// can() que decide menu, proxy e acesso negado. Assim o vendedor não recebe
// tutorial de assinatura, e um artigo nunca ensina uma tela que a pessoa não
// consegue abrir.

export function canReadArticle(roleId: string | null | undefined, article: HelpArticle): boolean {
  if (!roleId) return false;
  return article.requires.every((r) => can(roleId, r.route, r.level ?? "view"));
}

export function visibleArticles(roleId: string | null | undefined, articles: readonly HelpArticle[]): HelpArticle[] {
  return articles.filter((a) => canReadArticle(roleId, a));
}

// Slug inexistente e slug sem permissão dão o mesmo resultado — a tela não
// revela que o artigo existe.
export function findArticle(slug: string | null | undefined, roleId: string | null | undefined, articles: readonly HelpArticle[]): HelpArticle | null {
  if (!slug) return null;
  const hit = articles.find((a) => a.slug === slug);
  return hit && canReadArticle(roleId, hit) ? hit : null;
}

export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function haystack(a: HelpArticle): string {
  return normalize([
    a.title, a.summary, a.intro ?? "", ...(a.keywords ?? []),
    ...a.steps.flatMap((s) => [s.title, s.body, s.tip ?? "", s.warn ?? ""]),
    ...(a.faq ?? []).flatMap((f) => [f.q, f.a]),
  ].join(" "));
}

// Busca por todas as palavras (ordem livre), sem acento e sem caixa. Título
// que casa vem antes de corpo que casa.
export function searchArticles(query: string, articles: readonly HelpArticle[]): HelpArticle[] {
  const terms = normalize(query).split(/\s+/).filter((t) => t.length > 1);
  if (!terms.length) return [...articles];
  const scored = articles
    .map((a) => {
      const body = haystack(a);
      if (!terms.every((t) => body.includes(t))) return null;
      const title = normalize(a.title);
      const score = terms.reduce((s, t) => s + (title.includes(t) ? 3 : 0) + (normalize(a.summary).includes(t) ? 1 : 0), 0);
      return { a, score };
    })
    .filter((x): x is { a: HelpArticle; score: number } => x !== null);
  return scored.sort((x, y) => y.score - x.score).map((x) => x.a);
}

export function groupByModule(modules: readonly HelpModule[], articles: readonly HelpArticle[]) {
  return modules
    .map((m) => ({ module: m, articles: articles.filter((a) => a.module === m.id) }))
    .filter((g) => g.articles.length > 0);
}

// Trilha "comece por aqui" de cada perfil: o essencial do dia a dia dele, em
// ordem. Artigos que o perfil não alcança somem sozinhos.
export const TRAILS: Record<string, string[]> = {
  vendedor: ["tour-pelo-app", "venda-no-balcao", "venda-completa", "caixa-abrir-fechar", "clientes-e-credito", "consultar-produto", "busca-e-atalhos", "pedir-acesso"],
  estoquista: ["tour-pelo-app", "cadastrar-produto", "entrada-de-estoque", "transferir-entre-lojas", "contagem-de-inventario", "reposicao-e-pedido", "conferencia-da-nota", "ajuste-de-inventario"],
  financeiro: ["tour-pelo-app", "relatorio-de-vendas", "lucratividade", "caixa-abrir-fechar", "assinatura-e-planos", "creditos-de-ia", "emissao-fiscal", "promocoes"],
  proprietario: ["tour-pelo-app", "onboarding", "unidades-e-lojas", "convidar-equipe", "cadastrar-produto", "venda-completa", "transferir-entre-lojas", "relatorio-de-vendas"],
};

export function trailFor(roleId: string | null | undefined, articles: readonly HelpArticle[]): HelpArticle[] {
  const slugs = (roleId && TRAILS[roleId]) || [];
  return slugs
    .map((s) => articles.find((a) => a.slug === s))
    .filter((a): a is HelpArticle => !!a && canReadArticle(roleId, a));
}

export function relatedFor(article: HelpArticle, roleId: string | null | undefined, articles: readonly HelpArticle[]): HelpArticle[] {
  return (article.related ?? [])
    .map((s) => articles.find((a) => a.slug === s))
    .filter((a): a is HelpArticle => !!a && canReadArticle(roleId, a));
}

export function isModule(id: string, modules: readonly HelpModule[]): id is HelpModuleId {
  return modules.some((m) => m.id === id);
}
