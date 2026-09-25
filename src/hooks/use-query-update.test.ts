import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const replace = vi.fn();
let currentSearch = "q=fone&page=3";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/products",
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

import { buildQueryString, useQueryUpdate } from "./use-query-update";

describe("buildQueryString", () => {
  it("troca um filtro e volta pra página 1", () => {
    expect(buildQueryString("q=fone&page=3", { brand: "Voltway" })).toBe("q=fone&brand=Voltway");
  });

  it("remove parâmetro com null ou string vazia", () => {
    expect(buildQueryString("q=fone&brand=X", { q: "", brand: null })).toBe("");
  });

  it("mantém os filtros ao trocar de página", () => {
    expect(buildQueryString("q=fone", { page: 2 })).toBe("q=fone&page=2");
  });

  it("não escreve page=1 na URL", () => {
    expect(buildQueryString("q=fone&page=4", { page: 1 })).toBe("q=fone");
  });

  it("codifica texto com caracteres reservados", () => {
    expect(buildQueryString("", { q: "a&b=c,%" })).toBe("q=a%26b%3Dc%2C%25");
  });
});

describe("useQueryUpdate", () => {
  beforeEach(() => {
    replace.mockClear();
    currentSearch = "q=fone&page=3";
  });

  it("faz replace da URL sem rolar a página", () => {
    const { result } = renderHook(() => useQueryUpdate());
    act(() => {
      result.current.update({ stock: "low" });
    });
    expect(replace).toHaveBeenCalledWith("/products?q=fone&stock=low", { scroll: false });
  });

  it("limpa a query inteira quando não sobra parâmetro", () => {
    currentSearch = "q=fone";
    const { result } = renderHook(() => useQueryUpdate());
    act(() => {
      result.current.update({ q: null });
    });
    expect(replace).toHaveBeenCalledWith("/products", { scroll: false });
  });
});
