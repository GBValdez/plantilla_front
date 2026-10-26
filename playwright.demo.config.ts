import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './demo-tests',
  timeout: 30000,
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4312',
    channel: 'msedge',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node tools/run-demo.mjs --port 4312 --api-port 5382',
    url: 'http://127.0.0.1:4312/login',
    reuseExistingServer: false,
    timeout: 120000,
  },
});
