import path from "node:path";
import { test as setup, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { QA_EMAIL, QA_PASSWORD, QA_STORE_NAME } from "./qa-fixture";

const authFile = path.join(__dirname, ".auth/tenant.json");

// Provisiona (só na primeira vez) um tenant fixo pelos próprios fluxos reais
// de signup/login — não insere direto nas tabelas via service_role, porque
// fn_complete_signup exige auth.uid() de uma sessão de verdade. Depois só
// reaproveita: idempotente entre execuções locais e no CI.
setup("autentica o tenant de teste do e2e", async ({ page }) => {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: usersPage } = await admin.auth.admin.listUsers();
  const existingUser = usersPage.users.find((u) => u.email === QA_EMAIL);

  let hasTenant = false;
  if (existingUser) {
    const { data: profile } = await admin.from("profiles").select("tenant_id").eq("id", existingUser.id).maybeSingle();
    hasTenant = Boolean(profile?.tenant_id);
  }

  if (hasTenant) {
    await page.goto("/login");
    await page.getByPlaceholder("voce@sualoja.com.br").fill(QA_EMAIL);
    await page.getByPlaceholder("••••••••").fill(QA_PASSWORD);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
  } else {
    await page.goto("/signup");
    await page.getByPlaceholder("Mariana Souza").fill("E2E Tenant");
    await page.getByPlaceholder("voce@sualoja.com.br").fill(QA_EMAIL);
    await page.getByPlaceholder("••••••••").fill(QA_PASSWORD);
    await page.getByPlaceholder("Bonsucesso Varejo").fill(QA_STORE_NAME);
    await page.getByRole("button", { name: /criar loja e configurar/i }).click();
    await expect(page).toHaveURL("/onboarding");
    return page.context().storageState({ path: authFile });
  }

  await expect(page).toHaveURL("/dashboard");
  await page.context().storageState({ path: authFile });
});
