import { describe, it, expect } from "vitest";
import { canReadArticle, findArticle, searchArticles, trailFor, visibleArticles, relatedFor, groupByModule } from "./access";
import { HELP_MODULES } from "./modules";
import type { HelpArticle } from "./types";

const art = (slug: string, requires: HelpArticle["requires"], extra: Partial<HelpArticle> = {}): HelpArticle => ({
  slug, title: slug, summary: "", module: "estoque", level: "essencial", requires, steps: [{ title: "passo", body: "" }], updatedAt: "2026-09-28", ...extra,
});

const LIST: HelpArticle[] = [
  art("venda-no-balcao", [{ route: "/pos", level: "edit" }], { module: "vendas", title: "Vender no balcão", keywords: ["pdv"] }),
  art("transferir-entre-lojas", [{ route: "/stock/transfer", level: "edit" }], { title: "Transferência entre lojas", related: ["venda-no-balcao", "lucratividade"] }),
  art("lucratividade", [{ route: "/reports/profit" }], { module: "relatorios", title: "Lucratividade" }),
  art("convidar-equipe", [{ route: "/settings/users", level: "full" }], { module: "configuracao", title: "Convidar equipe" }),
  art("assinatura", [{ route: "/settings/subscription", level: "edit" }], { module: "financeiro", title: "Assinatura" }),
];

describe("visibilidade por perfil", () => {
  it("vendedor vê só o que alcança (balcão), nada de estoque, dinheiro ou governança", () => {
    expect(visibleArticles("vendedor", LIST).map((a) => a.slug)).toEqual(["venda-no-balcao"]);
  });
  it("gestor de estoque não vê assinatura nem equipe; consulta lucratividade", () => {
    expect(visibleArticles("estoquista", LIST).map((a) => a.slug)).toEqual(["venda-no-balcao", "transferir-entre-lojas", "lucratividade"]);
  });
  it("financeiro vê assinatura e lucratividade, mas não transferência (só consulta estoque)", () => {
    expect(visibleArticles("financeiro", LIST).map((a) => a.slug)).toEqual(["lucratividade", "assinatura"]);
  });
  it("proprietário vê tudo", () => {
    expect(visibleArticles("proprietario", LIST)).toHaveLength(LIST.length);
  });
  it("sem perfil não vê nada", () => {
    expect(visibleArticles(null, LIST)).toEqual([]);
    expect(canReadArticle(undefined, LIST[0])).toBe(false);
  });
  it("exige TODAS as telas do artigo", () => {
    const both = art("x", [{ route: "/pos", level: "edit" }, { route: "/reports/profit" }]);
    expect(canReadArticle("vendedor", both)).toBe(false);
    expect(canReadArticle("proprietario", both)).toBe(true);
  });
});

describe("findArticle", () => {
  it("acha pelo slug quando o perfil pode ler", () => {
    expect(findArticle("lucratividade", "financeiro", LIST)?.slug).toBe("lucratividade");
  });
  it("slug sem permissão e slug inexistente dão o mesmo null", () => {
    expect(findArticle("lucratividade", "vendedor", LIST)).toBeNull();
    expect(findArticle("nao-existe", "proprietario", LIST)).toBeNull();
    expect(findArticle(null, "proprietario", LIST)).toBeNull();
  });
});

describe("searchArticles", () => {
  it("ignora acento e caixa", () => {
    expect(searchArticles("TRANSFERENCIA", LIST).map((a) => a.slug)).toEqual(["transferir-entre-lojas"]);
    expect(searchArticles("balcao", LIST)[0].slug).toBe("venda-no-balcao");
  });
  it("busca nas palavras-chave e exige todos os termos", () => {
    expect(searchArticles("pdv", LIST).map((a) => a.slug)).toEqual(["venda-no-balcao"]);
    expect(searchArticles("pdv lucratividade", LIST)).toEqual([]);
  });
  it("consulta vazia devolve tudo", () => {
    expect(searchArticles("  ", LIST)).toHaveLength(LIST.length);
  });
});

describe("trilha e relacionados", () => {
  it("trilha do perfil só tem artigos que ele alcança", () => {
    const full = [...LIST, art("tour-pelo-app", [{ route: "/dashboard" }])];
    expect(trailFor("vendedor", full).map((a) => a.slug)).toEqual(["tour-pelo-app", "venda-no-balcao"]);
  });
  it("relacionados escondem o que o perfil não alcança", () => {
    expect(relatedFor(LIST[1], "estoquista", LIST).map((a) => a.slug)).toEqual(["venda-no-balcao", "lucratividade"]);
    expect(relatedFor(LIST[1], "vendedor", LIST).map((a) => a.slug)).toEqual(["venda-no-balcao"]);
  });
  it("agrupa por módulo sem módulos vazios", () => {
    const groups = groupByModule(HELP_MODULES, visibleArticles("vendedor", LIST));
    expect(groups.map((g) => g.module.id)).toEqual(["vendas"]);
  });
});
