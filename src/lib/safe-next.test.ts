import { describe, it, expect } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("mantém caminho interno com query", () => {
    expect(safeNext("/products/detail?id=abc")).toBe("/products/detail?id=abc");
    expect(safeNext("/dashboard")).toBe("/dashboard");
  });

  it("recusa URL absoluta e protocol-relative", () => {
    expect(safeNext("https://evil.com")).toBe("/dashboard");
    expect(safeNext("//evil.com")).toBe("/dashboard");
    expect(safeNext("/\\evil.com")).toBe("/dashboard");
  });

  it("recusa tab/quebra de linha que o navegador descarta", () => {
    expect(safeNext("/\t/evil.com")).toBe("/dashboard");
    expect(safeNext("/\n/evil.com")).toBe("/dashboard");
    expect(safeNext("/%09/evil.com")).toBe("/%09/evil.com");
  });

  it("recusa não-string e texto enorme", () => {
    expect(safeNext(undefined)).toBe("/dashboard");
    expect(safeNext(42)).toBe("/dashboard");
    expect(safeNext("/" + "a".repeat(600))).toBe("/dashboard");
    expect(safeNext("evil", "/onboarding")).toBe("/onboarding");
  });
});
