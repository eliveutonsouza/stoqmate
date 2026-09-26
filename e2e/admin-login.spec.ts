import { test, expect } from "@playwright/test";
import { totp } from "./totp";

// Staff de teste com 2FA real (TOTP). Credenciais só no .env.local —
// sem elas o teste é pulado (CI sem segredo não quebra).
const EMAIL = process.env.E2E_STAFF_EMAIL;
const PASSWORD = process.env.E2E_STAFF_PASSWORD;
const SECRET = process.env.E2E_STAFF_TOTP_SECRET;

test.describe("login admin com 2FA", () => {
  test.skip(!EMAIL || !PASSWORD || !SECRET, "E2E_STAFF_* não configurados");

  async function fill(page: import("@playwright/test").Page, code: string) {
    await page.goto("/login/admin");
    await expect(page.getByRole("heading", { name: "Acesso administrativo" })).toBeVisible();
    await page.getByLabel("Email corporativo").fill(EMAIL!);
    await page.getByLabel("Senha").fill(PASSWORD!);
    await page.getByPlaceholder("000 000").fill(code);
    await page.getByRole("button", { name: "Entrar no console" }).click();
  }

  test("código errado não entra e não deixa sessão aal1 viva", async ({ page }) => {
    await fill(page, "000000");
    await expect(page.getByText("Código 2FA inválido.")).toBeVisible();
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login\/admin/);
  });

  test("código TOTP válido entra no console e protege as rotas", async ({ page }) => {
    await fill(page, totp(SECRET!));
    await expect(page).toHaveURL(/localhost:\d+\/admin$/);
    await page.goto("/admin/stores");
    await expect(page).toHaveURL(/\/admin\/stores/);
    // Staff não tem loja: rota de loja manda de volta pro console.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/localhost:\d+\/admin/);
  });
});
