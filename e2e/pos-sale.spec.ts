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

// A grade inicial é só uma amostra; a busca vai ao banco. O leitor de código
// de barras digita o código e manda Enter — código/SKU exato entra direto.
test("POS: busca no banco e Enter com SKU exato adiciona ao carrinho", async ({ page }) => {
  await page.goto("/pos");
  const search = page.getByPlaceholder("Bipe o produto ou busque por nome/SKU");
  await search.fill("ELE-FONE-PRT");
  await expect(page.getByTestId("pos-product")).toHaveCount(1);
  await search.press("Enter");
  await expect(page.getByTestId("pos-cart-item")).toHaveCount(1);
  await expect(search).toHaveValue("");

  await search.fill("zzz-nao-existe-zzz");
  await expect(page.getByText("Nenhum produto encontrado.")).toBeVisible();
});
