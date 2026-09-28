import { test, expect } from "@playwright/test";

// Jornada da central de ajuda com o tenant de QA (Proprietário: vê todos os
// artigos). A filtragem por perfil é coberta nos testes de src/lib/help.
test("central de ajuda: busca, abre artigo com vídeo e leva para a tela", async ({ page }) => {
  await page.goto("/help");
  await expect(page.getByRole("heading", { name: "Central de ajuda" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Comece por aqui" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Tutoriais em vídeo" })).toBeVisible();

  await page.getByRole("searchbox", { name: "Buscar na central de ajuda" }).fill("transferencia");
  const hit = page.locator('[data-help-article="transferir-entre-lojas"]').first();
  await expect(hit).toBeVisible();
  await hit.click();

  await expect(page).toHaveURL(/\/help\?artigo=transferir-entre-lojas$/);
  await expect(page.getByRole("heading", { name: /Transferir entre lojas/ })).toBeVisible();
  const video = page.locator("video");
  await expect(video).toHaveAttribute("poster", /help-media\/v1\/videos\/transferencia\.jpg$/);
  await expect(video.locator('track[kind="captions"][srclang="pt-BR"]')).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Neste artigo" })).toBeVisible();

  await page.getByRole("button", { name: /Abrir esta tela/ }).click();
  await expect(page).toHaveURL("/stock/transfer");
});

test("central de ajuda: módulo lista os artigos do assunto", async ({ page }) => {
  await page.goto("/help");
  await page.locator('[data-help-module="vendas"]').click();
  await expect(page.locator('[data-help-article="venda-no-balcao"]')).toBeVisible();
  await page.getByRole("button", { name: /Todos os assuntos/ }).click();
  await expect(page.locator('[data-help-module="vendas"]')).toBeVisible();
});

test("artigo inexistente cai no índice com aviso, sem revelar nada", async ({ page }) => {
  await page.goto("/help?artigo=nao-existe");
  await expect(page.getByRole("alert").filter({ hasText: "Artigo não encontrado" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Central de ajuda" })).toBeVisible();
});
