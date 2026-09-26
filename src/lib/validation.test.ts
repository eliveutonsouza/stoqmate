import { afterEach, describe, expect, it, vi } from "vitest";
import { allUuids, isCnpj, isEmail, isOwnStorageUrl, isUuid, passwordError, textError } from "./validation";

describe("validation", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("email", () => {
    expect(isEmail("ana@loja.com.br")).toBe(true);
    expect(isEmail("ana@loja")).toBe(false);
    expect(isEmail("ana loja@x.com")).toBe(false);
    expect(isEmail(null)).toBe(false);
  });

  it("uuid e listas de uuid (bloqueia injeção em filtro PostgREST)", () => {
    expect(isUuid("7cd0b2b9-209e-4498-8c99-367659dce5ee")).toBe(true);
    expect(allUuids(["7cd0b2b9-209e-4498-8c99-367659dce5ee"])).toBe(true);
    expect(allUuids(["7cd0b2b9-209e-4498-8c99-367659dce5ee", "x),id.neq.(0"])).toBe(false);
    expect(allUuids("nope")).toBe(false);
  });

  it("texto e senha", () => {
    expect(textError("  ", "o nome")).toBe("Informe o nome.");
    expect(textError("a", "o nome da loja", 2)).toBe("O nome da loja precisa ter pelo menos 2 caracteres.");
    expect(textError("ok", "o nome")).toBeNull();
    expect(passwordError("1234567")).not.toBeNull();
    expect(passwordError("12345678")).toBeNull();
  });

  it("url do storage do próprio projeto", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    expect(isOwnStorageUrl("https://abc.supabase.co/storage/v1/object/public/branding/t/logo.png", "branding")).toBe(true);
    expect(isOwnStorageUrl("https://evil.com/storage/v1/object/public/branding/x.png", "branding")).toBe(false);
    expect(isOwnStorageUrl("https://abc.supabase.co/storage/v1/object/public/avatars/x.png", "branding")).toBe(false);
    expect(isOwnStorageUrl("https://abc.supabase.co/storage/v1/object/public/branding/../x", "branding")).toBe(false);
  });
});

describe("isCnpj", () => {
  it("valida dígitos verificadores, com ou sem máscara", () => {
    expect(isCnpj("11.222.333/0001-81")).toBe(true);
    expect(isCnpj("11222333000181")).toBe(true);
    expect(isCnpj("11.222.333/0001-82")).toBe(false);
    expect(isCnpj("123")).toBe(false);
    expect(isCnpj("00.000.000/0000-00")).toBe(false);
    expect(isCnpj(null)).toBe(false);
  });
});
