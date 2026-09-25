import { describe, it, expect } from "vitest";
import { containsPattern, oneOf, pageParam, pageRange, param, uuidParam } from "./list-params";

describe("list-params", () => {
  it("param pega o primeiro valor, sem espaços, vazio vira null", () => {
    expect(param({ q: "  fone " }, "q")).toBe("fone");
    expect(param({ q: ["a", "b"] }, "q")).toBe("a");
    expect(param({ q: "   " }, "q")).toBeNull();
    expect(param({}, "q")).toBeNull();
  });

  it("oneOf descarta valor fora da lista", () => {
    expect(oneOf({ stock: "low" }, "stock", ["in", "low", "out"] as const)).toBe("low");
    expect(oneOf({ stock: "drop table" }, "stock", ["in", "low", "out"] as const)).toBeNull();
  });

  it("uuidParam só aceita uuid", () => {
    expect(uuidParam({ id: "3f2b8c1e-8d6a-4c1f-9b2e-1a2b3c4d5e6f" }, "id")).toBe("3f2b8c1e-8d6a-4c1f-9b2e-1a2b3c4d5e6f");
    expect(uuidParam({ id: "1 or 1=1" }, "id")).toBeNull();
  });

  it("pageParam cai pra 1 com lixo ou número inválido", () => {
    expect(pageParam({ page: "3" })).toBe(3);
    expect(pageParam({ page: "0" })).toBe(1);
    expect(pageParam({ page: "abc" })).toBe(1);
    expect(pageParam({})).toBe(1);
  });

  it("pageRange calcula intervalo inclusivo do .range()", () => {
    expect(pageRange(1)).toEqual({ from: 0, to: 49, offset: 0, limit: 50 });
    expect(pageRange(3)).toEqual({ from: 100, to: 149, offset: 100, limit: 50 });
  });
});

describe("containsPattern", () => {
  it("escapa curingas do LIKE", () => {
    expect(containsPattern("50%_off\\")).toBe("%50\\%\\_off\\\\%");
    expect(containsPattern("loja")).toBe("%loja%");
  });
});
