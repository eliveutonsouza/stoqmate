import { test, expect } from "@playwright/test";
import { listRoutes } from "./route-list";

for (const route of listRoutes()) {
  test(`rota ${route} responde 200 sem erro no console`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    expect(errors).toEqual([]);
  });
}
