import { test, expect } from "@playwright/test";

test("login leva ao dashboard", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Entrar na sua conta" })).toBeVisible();
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
});
