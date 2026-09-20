import { test, expect } from "@playwright/test";

test("configurações → branding carrega o formulário de marca", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("link", { name: /^Branding/ }).click();
  await expect(page).toHaveURL("/settings/branding");
});
