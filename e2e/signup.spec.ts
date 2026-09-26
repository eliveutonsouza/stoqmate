import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

test("signup finaliza e cai no onboarding", async ({ page }) => {
  const email = `e2e-signup-${Date.now()}@stoqmate-qa.com.br`;

  await page.goto("/signup");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByPlaceholder("Seu nome completo").fill("Signup E2E");
  await page.getByPlaceholder("voce@sualoja.com.br").fill(email);
  await page.getByPlaceholder("••••••••").fill("SignupPass123");
  await page.getByPlaceholder("Ex.: Loja Centro").fill(`Loja E2E ${Date.now()}`);
  // Aceite é obrigatório e começa desmarcado (LGPD).
  await page.getByRole("button", { name: /criar loja e configurar/i }).click();
  await expect(page.getByText("Aceite os termos de uso pra continuar.")).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /criar loja e configurar/i }).click();
  await expect(page).toHaveURL("/onboarding");

  // Limpeza: signup real cria auth.users + tenant de verdade — não deixa
  // lixo de teste acumulando no projeto Supabase a cada execução.
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await admin.auth.admin.listUsers();
  const created = data.users.find((u) => u.email === email);
  if (created) {
    const { data: profile } = await admin.from("profiles").select("tenant_id").eq("id", created.id).maybeSingle();
    if (profile?.tenant_id) await admin.from("tenants").delete().eq("id", profile.tenant_id);
    await admin.auth.admin.deleteUser(created.id);
  }
});
