import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'https://expertsacademy-staging.web.app',
    headless: false,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        viewport: null,
        launchOptions: { args: ['--start-maximized'] },
      },
    },
  ],
});
