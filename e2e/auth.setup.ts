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

  let tenantId: string | undefined;
  if (existingUser) {
    const { data: profile } = await admin.from("profiles").select("tenant_id").eq("id", existingUser.id).maybeSingle();
    tenantId = profile?.tenant_id ?? undefined;
  }

  // O tenant fixo nasce em trial: sem renovar, o suite inteiro quebra no dia
  // em que o trial vence (proxy manda tudo pra /trial-ended e o banco recusa
  // escrita de conta bloqueada). Fixture de teste, não regra de produto.
  if (tenantId) {
    const in30Days = new Date(Date.now() + 30 * 86_400_000).toISOString();
    const { error: trialError } = await admin.from("tenants").update({ trial_ends_at: in30Days })
      .eq("id", tenantId).eq("status", "trial").lt("trial_ends_at", new Date(Date.now() + 7 * 86_400_000).toISOString());
    if (trialError) throw trialError;
  }

  if (tenantId) {
    await page.goto("/login");
    await page.getByPlaceholder("voce@sualoja.com.br").fill(QA_EMAIL);
    await page.getByPlaceholder("••••••••").fill(QA_PASSWORD);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL("/dashboard");
  } else {
    await page.goto("/signup");
    await page.getByPlaceholder("Mariana Souza").fill("E2E Tenant");
    await page.getByPlaceholder("voce@sualoja.com.br").fill(QA_EMAIL);
    await page.getByPlaceholder("••••••••").fill(QA_PASSWORD);
    await page.getByPlaceholder("Bonsucesso Varejo").fill(QA_STORE_NAME);
    await page.getByRole("button", { name: /criar loja e configurar/i }).click();
    await expect(page).toHaveURL("/onboarding");

    const { data: newUser } = await admin.auth.admin.listUsers();
    tenantId = (
      await admin.from("profiles").select("tenant_id").eq("id", newUser.users.find((u) => u.email === QA_EMAIL)!.id).maybeSingle()
    ).data?.tenant_id;
  }

  // Seed mínimo (idempotente) pra jornadas que precisam de pelo menos 1
  // categoria + 1 produto reais (ex.: product-catalog.spec.ts) — via
  // service_role direto na tabela, não pela UI: é fixture de teste, não o
  // fluxo de criação em si (esse já é exercido pelas telas normais).
  if (tenantId) {
    // .limit(1) em vez de .maybeSingle(): rodar este setup repetidas vezes
    // (ou depois de testar manualmente com este mesmo tenant fixo) pode
    // deixar mais de 1 categoria/produto — maybeSingle() erra com 2+ linhas.
    const { data: existingCategories } = await admin.from("categories").select("id").eq("tenant_id", tenantId).limit(1);
    let categoryId = existingCategories?.[0]?.id as string | undefined;
    if (!categoryId) {
      const { data: category, error: categoryError } = await admin
        .from("categories")
        .insert({ tenant_id: tenantId, name: "Eletrônicos", code: "ELE", unit: "unidade", unit_plural: "unidades", icon: "Zap", color: "#1D4FD7" })
        .select("id")
        .single();
      if (categoryError) throw categoryError;
      categoryId = category!.id;
      await admin.from("category_attributes").insert({ category_id: categoryId, key: "cor", label: "Cor", type: "color", values: ["Preto", "Branco"], position: 0 });
    }

    const { data: existingProducts } = await admin.from("products").select("id").eq("tenant_id", tenantId).limit(1);
    if (!existingProducts?.length) {
      await admin.from("products").insert({
        tenant_id: tenantId, category_id: categoryId, sku: "ELE-FONE-PRT", brand: "Foneclear",
        name: "Fone Bluetooth ANC", attrs: { cor: "Preto" }, cost_price: 158, sale_price: 299, min_stock: 5,
      });
    }
  }

  await page.context().storageState({ path: authFile });
});
