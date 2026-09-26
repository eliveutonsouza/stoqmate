import { describe, expect, it } from "vitest";
import { buildCsp, createNonce } from "./csp";

const base = { supabaseUrl: "https://abc.supabase.co/", dev: false, https: true };

describe("buildCsp", () => {
  it("app autenticado: script só com nonce, sem unsafe-inline", () => {
    const csp = buildCsp({ ...base, nonce: "n0nc3" });
    const script = csp.split("; ").find((d) => d.startsWith("script-src"));
    expect(script).toBe("script-src 'self' 'nonce-n0nc3' 'strict-dynamic'");
    expect(csp).toContain("connect-src 'self' https://abc.supabase.co wss://abc.supabase.co");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("rota pública sem nonce; dev libera eval; http não força upgrade", () => {
    const csp = buildCsp({ ...base, dev: true, https: false });
    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("nonce é único por chamada", () => {
    expect(createNonce()).not.toBe(createNonce());
  });
});
