import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/website',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:18241', trace: 'retain-on-failure' },
  webServer: {
    command: 'python3 -m http.server 18241 --bind 127.0.0.1 --directory website',
    url: 'http://127.0.0.1:18241',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
