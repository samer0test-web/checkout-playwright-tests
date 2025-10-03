import { test as base, expect, type Page } from "@playwright/test";

type TestFixtures = {
  checkoutPage: Page;
};

type WorkerFixtures = {
  authState: Awaited<
    ReturnType<import("@playwright/test").BrowserContext["storageState"]>
  >;
};
// Fill OTP fields dynamically
async function fillOtpAdaptive(page: Page) {
  const boxes = page.locator('input[aria-label^="Please enter OTP character"]');
  await boxes.first().waitFor({ state: "visible", timeout: 4000 });
  const count = await boxes.count();
  // Generate random digits for OTP
  const code = Array.from({ length: count }, () =>
    Math.floor(Math.random() * 10)
  ).join("");
  // Fill each OTP box
  for (let i = 0; i < count; i++) {
    const box = boxes.nth(i);
    await box.click();
    await box.press(code[i]);
  }
}
// Wait until authentication tokens are stored in localStorage
async function waitForAuthReady(page: Page) {
  await page.waitForFunction(
    () =>
      localStorage.getItem("access") !== null &&
      localStorage.getItem("user") !== null,
    { timeout: 15_000 }
  );
}
export const test = base.extend<TestFixtures, WorkerFixtures>({
  // Worker-scoped fixture: performs login once per worker and saves state
  authState: [
    async ({ browser }, use, testInfo) => {
      const baseURL =
        (testInfo.project.use?.baseURL as string) ||
        "https://expertsacademy-staging.web.app";

      const context = await browser.newContext();
      const page = await context.newPage();
      // Set cookies approval in localStorage
      await page.addInitScript(() => {
        localStorage.setItem("cookies", "approved");
      });

      await page.goto(`${baseURL}/auth/login`, {
        waitUntil: "domcontentloaded",
      });
      await page
        .getByLabel("Email", { exact: true })
        .fill("abdulraheemsaka2025@gmail.com");
      await page.locator('input[type="password"]').fill(";mK[hrb#");
      await page.getByRole("button", { name: /continue/i }).click();
      await fillOtpAdaptive(page);
      await waitForAuthReady(page);
      const stateObject = await context.storageState();
      await context.close();
      await use(stateObject);
    },
    { scope: "worker" },
  ],
  // Page fixture: opens checkout page with saved auth state
  checkoutPage: async ({ browser, authState }, use, testInfo) => {
    const baseURL =
      (testInfo.project.use?.baseURL as string) ||
      "https://expertsacademy-staging.web.app";
    const context = await browser.newContext({ storageState: authState });
    const page = await context.newPage();
    await page.goto(`${baseURL}/cart/checkout`, {
      waitUntil: "domcontentloaded",
    });
    await use(page);
    await context.close();
  },
});

export { expect };
