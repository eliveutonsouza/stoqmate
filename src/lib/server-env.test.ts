import { describe, it, expect, vi } from "vitest";
import { assertServerEnv, checkServerEnv } from "./server-env";

const FULL = {
  NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service",
  STRIPE_SECRET_KEY: "sk_live_x",
  ANTHROPIC_API_KEY: "key",
  RESEND_API_KEY: "re",
};

describe("checkServerEnv", () => {
  it("nada faltando com o conjunto completo", () => {
    expect(checkServerEnv(FULL)).toEqual({ missing: [], warnings: [] });
  });

  it("lista só o nome da variável ausente ou em branco", () => {
    const { missing } = checkServerEnv({ ...FULL, STRIPE_SECRET_KEY: "  ", ANTHROPIC_API_KEY: undefined });
    expect(missing).toEqual(["STRIPE_SECRET_KEY", "ANTHROPIC_API_KEY"]);
  });

  it("avisa de chave de teste e trava de email", () => {
    const { warnings } = checkServerEnv({ ...FULL, STRIPE_SECRET_KEY: "sk_test_1", EMAIL_TEST_ALLOWLIST: "" });
    expect(warnings).toHaveLength(2);
  });
});

describe("assertServerEnv", () => {
  it("derruba a subida só em produção", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => assertServerEnv({ ...FULL, SUPABASE_SERVICE_ROLE_KEY: "", VERCEL_ENV: "production" })).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(() => assertServerEnv({ ...FULL, SUPABASE_SERVICE_ROLE_KEY: "", VERCEL_ENV: "preview" })).not.toThrow();
    warn.mockRestore();
  });
});
