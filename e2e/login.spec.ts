import { test, expect } from "@playwright/test";
import { QA_EMAIL, QA_PASSWORD } from "./qa-fixture";

test("login leva ao dashboard", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Entrar na sua conta" })).toBeVisible();
  await page.getByPlaceholder("voce@sualoja.com.br").fill(QA_EMAIL);
  await page.getByPlaceholder("••••••••").fill(QA_PASSWORD);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
});
