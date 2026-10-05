import { describe, it, expect } from "vitest";
import { gateStoreRoute } from "./access-gate";

describe("gateStoreRoute", () => {
  it("libera rota permitida pro perfil", () => {
    expect(gateStoreRoute("/pos", { role: "vendedor", access: "ok" })).toBeNull();
    expect(gateStoreRoute("/reports/profit", { role: "proprietario", access: "ok" })).toBeNull();
  });

  it("nega rota fora do perfil com a rota no parâmetro", () => {
    expect(gateStoreRoute("/reports/profit", { role: "vendedor", access: "ok" })).toBe(
      "/access-denied?route=%2Freports%2Fprofit",
    );
    expect(gateStoreRoute("/settings/users", { role: "financeiro", access: "ok" })).toMatch(/^\/access-denied/);
  });

  it("nega quando o usuário não tem perfil ativo", () => {
    expect(gateStoreRoute("/dashboard", { role: null, access: "ok" })).toMatch(/^\/access-denied/);
  });

  it("não interfere em rota desconhecida (404) nem no console", () => {
    expect(gateStoreRoute("/nao-existe", { role: "vendedor", access: "ok" })).toBeNull();
    expect(gateStoreRoute("/admin", { role: "vendedor", access: "ok" })).toBeNull();
  });

  it("past_due não bloqueia", () => {
    expect(gateStoreRoute("/dashboard", { role: "vendedor", access: "past_due" })).toBeNull();
  });

  it("trial vencido manda pra /trial-ended, mas deixa assinar", () => {
    expect(gateStoreRoute("/dashboard", { role: "proprietario", access: "trial_ended" })).toBe("/trial-ended");
    expect(gateStoreRoute("/settings/subscription", { role: "proprietario", access: "trial_ended" })).toBeNull();
    expect(gateStoreRoute("/profile", { role: "vendedor", access: "trial_ended" })).toBeNull();
  });

  it("conta bloqueada: perfil sem cobrança cai na tela de aviso, sem loop", () => {
    expect(gateStoreRoute("/settings/subscription", { role: "vendedor", access: "canceled" })).toBe("/account/cancelled");
    expect(gateStoreRoute("/account/cancelled", { role: "vendedor", access: "canceled" })).toBeNull();
    expect(gateStoreRoute("/billing/past-due", { role: "estoquista", access: "unpaid" })).toBeNull();
  });

  it("2FA pendente vai pro passo do código, levando a rota de volta", () => {
    expect(gateStoreRoute("/dashboard", { role: null, access: "mfa_required" })).toBe("/login?mfa=1");
    expect(gateStoreRoute("/products/detail", { role: null, access: "mfa_required" }, "?id=1")).toBe(
      "/login?mfa=1&next=%2Fproducts%2Fdetail%3Fid%3D1",
    );
  });

  it("sem empresa vai completar o cadastro", () => {
    expect(gateStoreRoute("/dashboard", { role: null, access: "no_tenant" })).toBe("/complete-signup");
  });
});
