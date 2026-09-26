import { afterEach, describe, expect, it, vi } from "vitest";
import { GENERIC_ERROR, PERMISSION_ERROR, userMessage } from "./errors";

describe("userMessage", () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  afterEach(() => log.mockClear());

  it("prefere o mapa da tela", () => {
    expect(userMessage({ message: "saldo insuficiente para o produto 123", code: "P0001" }, "t", { "saldo insuficiente": "Sem saldo." })).toBe("Sem saldo.");
    expect(log).not.toHaveBeenCalled();
  });

  it("traduz permissão por código e por texto", () => {
    expect(userMessage({ code: "42501", message: "permission denied for table x" }, "t")).toBe(PERMISSION_ERROR);
    expect(userMessage({ code: "P0001", message: "not authorized" }, "t")).toBe(PERMISSION_ERROR);
    expect(userMessage({ message: "new row violates row-level security policy for table \"suppliers\"" }, "t")).toBe(PERMISSION_ERROR);
  });

  it("não vaza texto técnico de constraint", () => {
    const msg = userMessage({ code: "23505", message: 'duplicate key value violates unique constraint "products_sku_key"' }, "t");
    expect(msg).toBe("Já existe um registro com esses dados.");
    expect(msg).not.toContain("constraint");
  });

  it("traduz códigos do Supabase Auth", () => {
    expect(userMessage({ code: "same_password", message: "New password should be different from the old password." }, "t"))
      .toBe("A nova senha precisa ser diferente da atual.");
  });

  it("usa a exceção das funções SQL como frase", () => {
    expect(userMessage({ code: "P0001", message: "desconto maior que o aprovado pelo gestor" }, "t")).toBe("Desconto maior que o aprovado pelo gestor.");
  });

  it("cai no genérico e loga o cru", () => {
    expect(userMessage({ message: "fetch failed" }, "ctx")).toBe(GENERIC_ERROR);
    expect(userMessage(null, "ctx")).toBe(GENERIC_ERROR);
    expect(log).toHaveBeenCalledWith("[ctx]", { code: undefined, message: "fetch failed" });
  });
});
