import { test, expect } from "@playwright/test";

test("POS: adicionar produto real aparece no carrinho", async ({ page }) => {
  await page.goto("/pos");

  const firstProduct = page.getByTestId("pos-product").first();
  await expect(firstProduct).toBeVisible();
  await firstProduct.click();

  await expect(page.getByTestId("pos-cart-item")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Cobrar e finalizar" })).toBeEnabled();
});
