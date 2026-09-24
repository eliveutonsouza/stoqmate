import { defineConfig, devices } from "@playwright/test";

process.loadEnvFile(".env.local");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      // signup/login testam o próprio fluxo de autenticação — precisam
      // começar deslogados, não reaproveitam o storageState do tenant fixo.
      // Dependem de "setup" só pra garantir ORDEM (o tenant fixo do login
      // precisa existir antes) — não herdam o storageState dele.
      name: "guest",
      use: { ...devices["Desktop Chrome"] },
      testMatch: [/signup\.spec\.ts/, /login\.spec\.ts/],
      dependencies: ["setup"],
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/tenant.json" },
      dependencies: ["setup"],
      testIgnore: [/signup\.spec\.ts/, /login\.spec\.ts/, /auth\.setup\.ts/, /mobile-nav\.spec\.ts/],
    },
    {
      // Responsividade: todas as rotas em celular e tablet, sem estouro de
      // largura (responsive.spec) + drawer/hamburger (mobile-nav.spec).
      name: "mobile",
      use: { ...devices["Pixel 7"], storageState: "e2e/.auth/tenant.json" },
      dependencies: ["setup"],
      testMatch: [/responsive\.spec\.ts/, /mobile-nav\.spec\.ts/],
    },
    {
      name: "tablet",
      use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 }, hasTouch: true, storageState: "e2e/.auth/tenant.json" },
      dependencies: ["setup"],
      testMatch: [/responsive\.spec\.ts/],
    },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
