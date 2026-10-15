import { defineConfig, devices } from "@playwright/test";

const port = 3000;

export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      // PLAYWRIGHT_CHANNEL=chrome usa o Chrome instalado, sem baixar o Chromium do Playwright.
      use: { ...devices["Desktop Chrome"], channel: process.env.PLAYWRIGHT_CHANNEL || undefined },
    },
  ],
  webServer: {
    env: { NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --import=./tests/e2e/apoio/sgs-fetch.mjs`.trim() },
    // No CI, o build é um passo anterior do workflow.
    command: process.env.CI
      ? `npm run start -- -H 127.0.0.1 -p ${port}`
      : `npm run build && npm run start -- -H 127.0.0.1 -p ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
