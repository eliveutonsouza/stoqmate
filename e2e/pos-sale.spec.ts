import { test, expect } from "@playwright/test";

test("POS: adicionar produto real aparece no carrinho", async ({ page }) => {
  await page.goto("/pos");

  // Produto com saldo na loja (o tenant de teste tem itens zerados).
  const firstProduct = page.getByRole("button", { name: / [1-9][0-9]* un$/ }).first();
  await expect(firstProduct).toBeVisible();
  await firstProduct.click();

  await expect(page.getByTestId("pos-cart-item")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Cobrar e finalizar" })).toBeEnabled();
});
