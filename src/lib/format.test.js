import { describe, it, expect } from "vitest";
import { brl } from "./format";

describe("brl", () => {
  it("formata número como moeda BRL com 2 casas decimais", () => {
    expect(brl(1234.5)).toBe("R$ 1.234,50");
  });

  it("formata zero corretamente", () => {
    expect(brl(0)).toBe("R$ 0,00");
  });
});
