import { test, expect } from "@playwright/test";

test("signup finaliza e cai no onboarding", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("button", { name: /criar loja e configurar/i }).click();
  await expect(page).toHaveURL("/onboarding");
});
