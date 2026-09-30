import { expect, type Page } from "@playwright/test";

// loading.tsx dos grupos (store)/(admin) mostra um shell com esqueleto
// enquanto a página faz streaming; por um instante os dois coexistem no DOM.
// Espera o esqueleto sair antes de interagir com a tela.
export const pageSettled = (page: Page) =>
  expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
