import { describe, it, expect } from "vitest";
import { csvCell, toCsv } from "./csv";

describe("csvCell", () => {
  it("usa vírgula decimal pro Excel em pt-BR", () => {
    expect(csvCell(1234.5)).toBe("1234,50");
    expect(csvCell(12)).toBe("12");
  });

  it("mantém número negativo como número (sem proteção de fórmula)", () => {
    expect(csvCell(-3)).toBe("-3");
  });

  it("neutraliza texto que viraria fórmula", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csvCell("-abc")).toBe("'-abc");
  });

  it("coloca entre aspas texto com separador ou quebra de linha", () => {
    expect(csvCell("a;b")).toBe("\"a;b\"");
    expect(csvCell("linha\nnova")).toBe("\"linha\nnova\"");
  });

  it("célula vazia pra null/undefined/NaN", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
    expect(csvCell(Number.NaN)).toBe("");
  });
});

describe("toCsv", () => {
  it("junta cabeçalho e linhas com ; e CRLF", () => {
    expect(toCsv(["Produto", "Receita"], [["Fone", 10.5], ["Cabo", 3]])).toBe("Produto;Receita\r\nFone;10,50\r\nCabo;3");
  });
});
