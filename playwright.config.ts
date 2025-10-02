import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL || "https://expertsacademy-staging.web.app",
    headless: isCI,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: isCI ? "retain-on-failure" : "off",
  },

  projects: [
    isCI
      ? {
          name: "chromium",
          use: {
            ...devices["Desktop Chrome"],
          },
        }
      : {
          name: "chromium",
          use: {
            viewport: null,
            launchOptions: { args: ["--start-maximized"] },
          },
        },
  ],
});
