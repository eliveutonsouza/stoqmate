import { describe, it, expect } from "vitest";
import { clamp, animate } from "./hero-film-engine";

describe("clamp", () => {
  it("mantém o valor quando já está dentro do intervalo", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("corta no mínimo e no máximo", () => {
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("animate", () => {
  it("retorna 'from' antes do início e 'to' depois do fim", () => {
    const fn = animate({ from: 0, to: 100, start: 2, end: 4 });
    expect(fn(0)).toBe(0);
    expect(fn(2)).toBe(0);
    expect(fn(4)).toBe(100);
    expect(fn(10)).toBe(100);
  });

  it("interpola no meio do intervalo", () => {
    const fn = animate({ from: 0, to: 100, start: 0, end: 10, ease: (t) => t });
    expect(fn(5)).toBeCloseTo(50, 5);
  });
});
