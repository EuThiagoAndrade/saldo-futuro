import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  testDir: '..',
  testMatch: 'navegacao-desempenho.spec.ts',
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: { ...devices['Desktop Chrome'], channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    baseURL: 'http://127.0.0.1:3105', viewport: { width: 1280, height: 900 }, trace: 'off', screenshot: 'off', video: 'off' },
  webServer: {
    cwd: fileURLToPath(new URL('../../../', import.meta.url)),
    command: 'npm run start -- -H 127.0.0.1 -p 3105',
    url: 'http://127.0.0.1:3105/entrar',
    reuseExistingServer: false,
    timeout: 180_000,
    env: { NODE_OPTIONS: '--import=./tests/e2e/apoio/medicao-fetch.mjs' },
  },
});
