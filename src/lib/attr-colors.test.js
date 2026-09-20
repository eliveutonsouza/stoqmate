import { describe, it, expect } from "vitest";
import { ATTR_COLORS, colorHex, isColorValue, variantLabel } from "./attr-colors";

describe("colorHex", () => {
  it("retorna o hex mapeado para um nome de cor conhecido", () => {
    expect(colorHex("Preto")).toBe(ATTR_COLORS.Preto);
  });

  it("cai no fallback quando o valor não é uma cor mapeada", () => {
    expect(colorHex("Não é cor")).toBe("var(--fg-faint)");
  });
});

describe("isColorValue", () => {
  it("reconhece valores presentes em ATTR_COLORS", () => {
    expect(isColorValue("Azul")).toBe(true);
  });

  it("rejeita valores fora do mapa (incluindo props herdadas de Object)", () => {
    expect(isColorValue("Roxo")).toBe(false);
    expect(isColorValue("toString")).toBe(false);
    expect(isColorValue("hasOwnProperty")).toBe(false);
  });
});

describe("variantLabel", () => {
  it("junta os valores de atributo com separador, ignorando vazios e traço", () => {
    expect(variantLabel({ cor: "Preto", numeracao: "40" })).toBe("Preto · 40");
    expect(variantLabel({ cor: "Preto", numeracao: "—" })).toBe("Preto");
    expect(variantLabel({ cor: "", numeracao: undefined })).toBe("");
  });

  it("retorna string vazia quando não recebe atributos", () => {
    expect(variantLabel(undefined)).toBe("");
  });
});
