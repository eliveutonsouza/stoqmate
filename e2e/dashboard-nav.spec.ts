import { test, expect } from "@playwright/test";

test("dashboard carrega e navega pelo sidebar", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText("Visão geral")).toBeVisible();

  await page.getByRole("link", { name: /^Catálogo/ }).click();
  await page.getByRole("link", { name: "Todos os produtos" }).click();
  await expect(page).toHaveURL("/products");

  await page.getByRole("link", { name: /^Dashboard/ }).click();
  await expect(page).toHaveURL("/dashboard");
});
