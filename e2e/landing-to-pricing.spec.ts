import { test, expect } from "@playwright/test";

test("landing → pricing via nav", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Planos" })).toBeVisible();
  await page.getByRole("link", { name: "Planos" }).click();
  await expect(page).toHaveURL("/pricing");
  await expect(page.getByRole("heading", { name: /Preço por loja/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Começar com Controle" })).toBeVisible();
});
