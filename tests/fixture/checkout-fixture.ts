import { test as base, expect, type Page } from '@playwright/test';

type TestFixtures = {
  checkoutPage: Page;
};

type WorkerFixtures = {
  authState: Awaited<ReturnType<import('@playwright/test').BrowserContext['storageState']>>;
};

async function fillOtpAdaptive(page: Page) {
  const boxes = page.locator('input[aria-label^="Please enter OTP character"]');
  await boxes.first().waitFor({ state: 'visible', timeout: 4000 });
  const count = await boxes.count();
  const code = Array.from({ length: count }, () => Math.floor(Math.random() * 10)).join('');
  for (let i = 0; i < count; i++) {
    const box = boxes.nth(i);
    await box.click();
    await box.press(code[i]);
    await page.waitForTimeout(50);
  }
}

async function waitForAuthReady(page: Page) {
  await page.waitForFunction(
    () =>
      localStorage.getItem('access') !== null &&
      localStorage.getItem('user') !== null,
    { timeout: 15_000 }
  );
}
export const test = base.extend<TestFixtures, WorkerFixtures>({
  authState: [
    async ({ browser }, use, testInfo) => {
      const baseURL =
        (testInfo.project.use?.baseURL as string) ||
        'https://expertsacademy-staging.web.app';

      const context = await browser.newContext();
      const page = await context.newPage();

      await page.addInitScript(() => {
        localStorage.setItem('cookies', 'approved');
      });

      await page.goto(`${baseURL}/auth/login`, { waitUntil: 'domcontentloaded' });
      await page.getByLabel('Email', { exact: true }).fill('abdulraheemsaka2025@gmail.com');
      await page.locator('input[type="password"]').fill(';mK[hrb#');
      await page.getByRole('button', { name: /continue/i }).click();
      await fillOtpAdaptive(page);
      await waitForAuthReady(page);
      const stateObject = await context.storageState();
      await context.close();
      await use(stateObject);
    },
    { scope: 'worker' },
  ],
  checkoutPage: async ({ browser, authState }, use, testInfo) => {
    const baseURL =
      (testInfo.project.use?.baseURL as string) ||
      'https://expertsacademy-staging.web.app';
    const context = await browser.newContext({ storageState: authState });
    const page = await context.newPage();
    await page.goto(`${baseURL}/cart/checkout`, { waitUntil: 'domcontentloaded' });
    await use(page);
    await context.close();
  },
});

export { expect };
