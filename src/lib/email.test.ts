import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { isAllowed, parseAllowlist, sendEmail } = await import("./email");

describe("allowlist de teste", () => {
  it("sem variável = sem trava; vazia = bloqueia tudo", () => {
    expect(isAllowed("a@b.com", parseAllowlist(undefined))).toBe(true);
    expect(isAllowed("a@b.com", parseAllowlist(""))).toBe(false);
  });

  it("aceita email exato e domínio com @", () => {
    const list = parseAllowlist(" dono@loja.com , @stoqmate-qa.com.br ");
    expect(isAllowed("DONO@loja.com", list)).toBe(true);
    expect(isAllowed("x@stoqmate-qa.com.br", list)).toBe(true);
    expect(isAllowed("cliente@real.com", list)).toBe(false);
    expect(isAllowed("x@evilstoqmate-qa.com.br", list)).toBe(false);
  });
});

describe("sendEmail", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it("não chama a API quando todos estão fora da allowlist", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "Stoqmate <no-reply@x.com>");
    vi.stubEnv("EMAIL_TEST_ALLOWLIST", "@qa.com");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const r = await sendEmail({ to: ["cliente@real.com"], subject: "s", text: "t" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(r.blocked).toEqual(["cliente@real.com"]);
    expect(r.error).toMatch(/allowlist/);
  });

  it("envia só os permitidos", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "Stoqmate <no-reply@x.com>");
    vi.stubEnv("EMAIL_TEST_ALLOWLIST", "@qa.com");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const r = await sendEmail({ to: ["a@qa.com", "b@real.com"], subject: "s", text: "t" });
    expect(r.sent).toEqual(["a@qa.com"]);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).to).toEqual(["a@qa.com"]);
  });
});
