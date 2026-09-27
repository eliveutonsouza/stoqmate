import { describe, it, expect } from "vitest";
import { can, areaFor, whoCanReach, auditRoutes } from "./permissions";
import { listRoutes } from "../../e2e/route-list";

describe("can", () => {
  it("nega rota fora da tabela", () => {
    expect(can("proprietario", "/rota-que-nao-existe")).toBe(false);
  });

  it("nega nível acima do configurado", () => {
    expect(can("vendedor", "/products", "edit")).toBe(false);
    expect(can("vendedor", "/products", "view")).toBe(true);
    // Formulário de gravação exige "Pode editar" mesmo pedindo só "view".
    expect(can("vendedor", "/stock/entry")).toBe(false);
    expect(can("vendedor", "/stock/history")).toBe(true);
    expect(can("estoquista", "/stock/entry")).toBe(true);
    expect(can("vendedor", "/stock/sale")).toBe(true);
  });

  it("libera rota pública pra qualquer perfil", () => {
    expect(can("vendedor", "/login")).toBe(true);
  });
});

describe("areaFor", () => {
  it("resolve rota conhecida", () => {
    expect(areaFor("/reports/profit")?.id).toBe("money");
  });

  it("retorna null pra rota fora do mapa", () => {
    expect(areaFor("/rota-que-nao-existe")).toBeNull();
  });
});

describe("whoCanReach", () => {
  it("frase no singular quando só 1 perfil alcança", () => {
    expect(whoCanReach("/settings/roles")).toBe("Só o perfil Proprietário alcança esta tela.");
  });

  it("frase no plural com 'e' antes do último nome", () => {
    expect(whoCanReach("/reports/profit")).toBe(
      "Alcançam esta tela: Gestor de Estoque, Gestor Financeiro e Proprietário."
    );
  });

  it("frase de nenhum perfil quando a área nega todo mundo", () => {
    expect(whoCanReach("/admin")).toBe("Nenhum perfil de loja alcança esta tela.");
  });
});

describe("auditRoutes", () => {
  it("cobre todas as rotas reais do app, sem faltar nem sobrar", () => {
    const audit = auditRoutes(listRoutes());
    expect(audit.missing).toEqual([]);
    expect(audit.phantom).toEqual([]);
  });
});
