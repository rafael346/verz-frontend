import { defineConfig, devices } from "@playwright/test";

/** Testes ponta a ponta contra a pilha do Docker no ar (README: "Testes ponta a ponta"). */
export default defineConfig({
  testDir: "e2e",
  outputDir: "e2e/test-results",
  globalSetup: "./e2e/global-setup.ts",
  retries: 0, // teste instável se corrige, não se repete
  // Um teste por vez: vários deles mexem no saldo da Ana (lance, estorno, arremate) e, em paralelo, um leria o do outro.
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:8080",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 375, height: 812 } },
      testMatch: /(vitrine|sala|auditoria)\.spec\.ts/,
    },
  ],
});
