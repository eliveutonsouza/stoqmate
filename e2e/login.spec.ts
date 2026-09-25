import { test, expect } from "@playwright/test";
import { QA_EMAIL, QA_PASSWORD } from "./qa-fixture";

test("login leva ao dashboard", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Entrar na sua conta" })).toBeVisible();
  await page.getByPlaceholder("voce@sualoja.com.br").fill(QA_EMAIL);
  await page.getByPlaceholder("••••••••").fill(QA_PASSWORD);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
});

// Credencial errada precisa chegar ao Supabase e voltar como invalid_credentials.
// Se a anon key estiver inválida, a mensagem vira a genérica e este teste falha
// — foi exatamente o incidente de produção que ficou mascarado.
test("credencial inválida mostra 'Email ou senha incorretos.'", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("voce@sualoja.com.br").fill("nao-existe@stoqmate-qa.com.br");
  await page.getByPlaceholder("••••••••").fill("senha-errada-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText("Email ou senha incorretos.")).toBeVisible();
  await expect(page).toHaveURL("/login");
});
