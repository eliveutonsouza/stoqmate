import { describe, it, expect } from "vitest";
import { brl, unitLabel } from "./format";

describe("brl", () => {
  it("formata número como moeda BRL com 2 casas decimais", () => {
    expect(brl(1234.5)).toBe("R$ 1.234,50");
  });

  it("formata zero corretamente", () => {
    expect(brl(0)).toBe("R$ 0,00");
  });
});

describe("unitLabel", () => {
  it("usa unidade singular quando |n| === 1", () => {
    expect(unitLabel("calcados", 1)).toBe("par");
    expect(unitLabel("calcados", -1)).toBe("par");
  });

  it("usa unidade plural para qualquer outro n", () => {
    expect(unitLabel("calcados", 0)).toBe("pares");
    expect(unitLabel("calcados", 5)).toBe("pares");
  });

  it("cai na primeira categoria quando o id não existe", () => {
    expect(unitLabel("categoria-inexistente", 2)).toBe("pares");
  });
});
