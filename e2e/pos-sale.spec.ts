import { test, expect } from "@playwright/test";

test("POS: adicionar produto novo aparece no carrinho", async ({ page }) => {
  await page.goto("/pos");
  await expect(page.getByText("Café em Grãos")).toHaveCount(1);

  await page.locator("button").filter({ hasText: "Café em Grãos" }).first().click();

  await expect(page.getByText("Café em Grãos")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Cobrar e finalizar" })).toBeEnabled();
});
