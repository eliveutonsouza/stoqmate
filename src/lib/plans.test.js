import { describe, it, expect } from "vitest";
import { PLANS, planEconomics, annualSavings } from "./plans";

describe("planEconomics", () => {
  it("calcula margem coerente para todos os planos (0-100%, custo cobre COGS)", () => {
    for (const plan of PLANS) {
      const eco = planEconomics(plan);
      expect(eco.margin).toBeLessThanOrEqual(100);
      expect(eco.gross).toBeCloseTo(plan.monthly - eco.cogs, 5);
    }
  });
});

describe("annualSavings", () => {
  it("economia anual bate com a diferença entre 12x mensal e o anual", () => {
    const plan = PLANS[0];
    const { monthly, yearly, save, pct } = annualSavings(plan);
    expect(monthly).toBe(plan.monthly * 12);
    expect(yearly).toBe(plan.yearly);
    expect(save).toBe(monthly - yearly);
    expect(pct).toBeCloseTo((save / monthly) * 100, 5);
  });

  it("escala com o número de lojas (units)", () => {
    const plan = PLANS[0];
    const one = annualSavings(plan, 1);
    const three = annualSavings(plan, 3);
    expect(three.monthly).toBe(one.monthly * 3);
    expect(three.yearly).toBe(one.yearly * 3);
  });
});
