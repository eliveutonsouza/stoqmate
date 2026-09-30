import { test, expect } from "@playwright/test";
import { pageSettled } from "./settle";

// Só no projeto "mobile": abaixo de 900px a sidebar do app vira drawer e o
// header público vira menu hamburger.
const drawerIsOpen = (page: import("@playwright/test").Page) =>
  page.locator(".app-shell").getAttribute("data-drawer").then((v) => v === "open");

test("drawer do app abre pelo hamburger, fecha com Esc e ao navegar", async ({ page }) => {
  await page.goto("/dashboard");
  await pageSettled(page);
  expect(await drawerIsOpen(page)).toBe(false);

  await page.getByRole("button", { name: "Abrir menu" }).click();
  expect(await drawerIsOpen(page)).toBe(true);
  await page.keyboard.press("Escape");
  expect(await drawerIsOpen(page)).toBe(false);

  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.locator(".app-sidebar").getByText("Notificações", { exact: true }).click();
  await expect(page).toHaveURL(/\/notifications$/);
  await pageSettled(page);
  expect(await drawerIsOpen(page)).toBe(false);
});

test("header público vira hamburger com os links", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".pub-nav")).toBeHidden();
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.locator(".pub-menu").getByText("Planos").click();
  await expect(page).toHaveURL(/\/pricing$/);
});
