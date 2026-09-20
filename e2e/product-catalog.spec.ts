import { test, expect } from "@playwright/test";

test("lista de produtos → detalhe do produto", async ({ page }) => {
  await page.goto("/products");
  const firstProductLink = page.locator("table a").first();
  await expect(firstProductLink).toBeVisible();
  await firstProductLink.click();
  await expect(page).toHaveURL(/\/products\/detail\?id=/);
});
