import { describe, it, expect } from "vitest";
import { CATEGORIES, catById } from "./mock";

describe("catById", () => {
  it("retorna a categoria correspondente ao id", () => {
    expect(catById("vestuario").name).toBe("Vestuário");
  });

  it("cai na primeira categoria quando o id não existe", () => {
    expect(catById("inexistente")).toBe(CATEGORIES[0]);
  });
});
