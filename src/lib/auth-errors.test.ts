import { describe, it, expect } from "vitest";
import { signInErrorMessage, isInvalidCredentials } from "./auth-errors";

describe("signInErrorMessage", () => {
  it("só credencial inválida vira 'senha incorreta'", () => {
    expect(signInErrorMessage({ code: "invalid_credentials", status: 400 })).toBe("Email ou senha incorretos.");
    expect(isInvalidCredentials({ code: "invalid_credentials" })).toBe(true);
  });

  it("rate limit tem mensagem própria", () => {
    expect(signInErrorMessage({ status: 429 })).toMatch(/Muitas tentativas/);
  });

  it("chave de API inválida, rede ou erro desconhecido não culpam a senha", () => {
    for (const error of [{ status: 401 }, { status: 0, code: undefined }, { status: 500 }, null]) {
      expect(signInErrorMessage(error)).toBe("Não foi possível entrar agora. Tente de novo em instantes.");
      expect(isInvalidCredentials(error)).toBe(false);
    }
  });
});
