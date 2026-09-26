import { test, expect } from "@playwright/test";

// Tenant fixo é proprietário: vê margem e não precisa de aprovação de
// desconto (quem precisa é validado no banco — fn_confirm_sale).
test("venda: cliente pesquisável, sem trava de aprovação para o gestor", async ({ page }) => {
  await page.goto("/stock/sale");
  await expect(page.getByRole("heading", { name: "Nova venda" })).toBeVisible();
  await expect(page.getByPlaceholder(/Consumidor final/)).toBeEnabled();
  await expect(page.getByText("Cadastro de clientes chega na próxima etapa")).toHaveCount(0);

  // ELE-FONE-PRT é o item do tenant de teste com saldo.
  await page.getByPlaceholder("Buscar por SKU, código de barras, marca ou nome…").fill("ELE-FONE-PRT");
  const result = page.getByRole("button", { name: /ELE-FONE-PRT/ });
  await result.waitFor({ state: "visible" });
  await result.dispatchEvent("mousedown");
  await expect(page.getByText("Carrinho vazio")).toHaveCount(0);

  await page.getByRole("button", { name: /Desconto no total/ }).click();
  await page.getByRole("button", { name: "20%" }).click();
  await page.getByRole("spinbutton").last().fill("30");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.getByRole("button", { name: /Confirmar venda/ })).toBeVisible();
  await expect(page.getByText("Margem do atendimento")).toBeVisible();
});
