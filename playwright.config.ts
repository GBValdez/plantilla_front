import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4310',
    channel: 'msedge',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command:
      'node node_modules/@angular/cli/bin/ng.js serve --host 127.0.0.1 --port 4310',
    url: 'http://127.0.0.1:4310',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
