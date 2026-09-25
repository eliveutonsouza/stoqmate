import { describe, it, expect } from "vitest";
import { CATEGORY_TEMPLATES, templateById } from "./category-templates";

describe("templateById", () => {
  it("retorna o modelo correspondente ao id", () => {
    expect(templateById("vestuario").name).toBe("Vestuário");
  });

  it("não inventa categoria quando o id não existe", () => {
    expect(templateById("inexistente")).toBeUndefined();
  });

  it("todo modelo tem código, unidade e atributos", () => {
    for (const t of CATEGORY_TEMPLATES) {
      expect(t.code).toBeTruthy();
      expect(t.unit).toBeTruthy();
      expect(t.attributes.length).toBeGreaterThan(0);
    }
  });
});
