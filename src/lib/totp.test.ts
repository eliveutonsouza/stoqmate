import { describe, expect, it } from "vitest";
import { totp } from "../../e2e/totp";

// Vetores do RFC 6238 (SHA-1, segredo ASCII "12345678901234567890"),
// truncados pra 6 dígitos.
const SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("totp (helper do e2e)", () => {
  it("bate com os vetores do RFC 6238", () => {
    expect(totp(SECRET, 59 * 1000)).toBe("287082");
    expect(totp(SECRET, 1111111109 * 1000)).toBe("081804");
    expect(totp(SECRET, 1234567890 * 1000)).toBe("005924");
  });
});
