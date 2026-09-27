import { describe, expect, it } from "vitest";
import { paymentLabel, paymentTotals, REFUND_METHODS, SALE_METHODS, validatePayments } from "./payment-methods";

describe("payment-methods", () => {
  it("não oferece crediário nem 'dividido' como forma", () => {
    expect(SALE_METHODS.map((m) => m.id)).not.toContain("crediario");
    expect(SALE_METHODS.map((m) => m.id)).not.toContain("dividido");
    expect(REFUND_METHODS.map((m) => m.id)).toEqual(["dinheiro", "pix", "credito_loja", "outro"]);
    expect(paymentLabel("credito_loja")).toBe("Crédito da loja");
  });

  it("soma e falta com centavos", () => {
    expect(paymentTotals([{ amount: 10.1 }, { amount: 20.2 }], 30.3)).toEqual({ paid: 30.3, remaining: 0 });
    expect(paymentTotals([{ amount: 10 }], 25)).toEqual({ paid: 10, remaining: 15 });
  });

  it("valida como o banco", () => {
    expect(validatePayments([{ method: "pix", amount: 30 }, { method: "dinheiro", amount: 20 }], 50)).toBeNull();
    expect(validatePayments([{ method: "pix", amount: 30 }], 50)).toMatch(/Falta distribuir R\$ 20,00/);
    expect(validatePayments([{ method: "credito_loja", amount: 50 }], 50)).toMatch(/exige o cliente/);
    expect(validatePayments([{ method: "credito_loja", amount: 50 }], 50, { customerId: "c1" })).toBeNull();
    expect(validatePayments([{ method: "pix", amount: 50, installments: 3 }], 50)).toMatch(/Parcelas/);
    expect(validatePayments([{ method: "crediario", amount: 50 }], 50)).toMatch(/inválida/);
    expect(validatePayments([{ method: "debito", amount: 10 }], 10, { refund: true })).toMatch(/inválida/);
    expect(validatePayments([], 0)).toBeNull();
  });
});
