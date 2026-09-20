import { test, expect } from "@playwright/test";

test("hero: prefers-reduced-motion mostra o print estático, não o filme animado", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByTestId("hero-film-static")).toBeVisible();
  // O motor de animação não deve nem montar o stage nesse modo.
  await expect(page.getByTestId("hero-film").locator("canvas, svg")).toHaveCount(0);
});

test("hero: sem reduced-motion, o filme monta sem erro no console", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/");
  await expect(page.getByTestId("hero-film")).toBeVisible();
  // Deixa o motor rodar alguns frames antes de checar.
  await page.waitForTimeout(500);

  expect(errors).toEqual([]);
});
