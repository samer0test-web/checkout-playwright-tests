import { test, expect } from './fixture/checkout-fixture';
test.describe('Checkout Flow', () => {

test('Invalid voucher does not change cart total', async ({ checkoutPage }) => {
  const input = checkoutPage.getByLabel('Voucher Code', { exact: true }).fill('INVALID-TEST');
  await checkoutPage.getByRole('button', { name: /^apply$/i }).click();
    const errorMsg =
    checkoutPage.locator('[data-testid="voucher-error"]').first()
      .or(checkoutPage.locator('div.text-caption.text-error.mt-1').first());
  await expect(errorMsg).toBeVisible({ timeout: 5000 });
  await expect(errorMsg).toHaveText(/Invalid code\. Please check and try again\./i);
});

test('Failed Payment reflects FAILED in API', async ({ checkoutPage }) => {
    const token = await checkoutPage.evaluate(() => localStorage.getItem('access'));
    if (!token) throw new Error('No access token in localStorage');
    const auth = { headers: { Authorization: `Bearer ${token}` } };
    const cartRes = await checkoutPage.request.get(
        'https://staging.himam.com/api/orders/cart',
        auth
    );
    if (!cartRes.ok()) {
        const body = await cartRes.text();
        throw new Error(`Cart API failed: ${cartRes.status()} ${body}`);
    }
    const cartJson = await cartRes.json();
    const orderId: number | undefined =
        cartJson?.order?.id ?? cartJson?.id ?? cartJson?.data?.order?.id;

    if (!orderId) {
        throw new Error('Could not extract orderId from cart response');
    }
    const $ = (s: string) => checkoutPage.locator(s);
    await $('label:has-text("Checkout")').click();
    await $('#mysr-cc-name').fill('Test User');
    await $('#mysr-cc-number').fill('4242424242424242');
    await $('input[placeholder="MM / YY"]').fill('08/29');
    await $('input[placeholder="CVC"]').fill('059');
    await $('.mysr-form-button').click();
    await $('#auth_result').selectOption('AUTHENTICATED');
    await $('input[value="Submit"]').click();
    const deadline = Date.now() + 40_000;
    const stepMs = 1200;
    let status = 'PENDING';

    while (Date.now() < deadline) {
        const orderRes = await checkoutPage.request.get(
            `https://staging.himam.com/api/orders/${orderId}`,
            auth
        );
        const orderJson = await orderRes.json();
        status = orderJson?.statusSlug ?? orderJson?.order?.statusSlug ?? status;
        if (status !== 'PENDING') break;
        await checkoutPage.waitForTimeout(stepMs);
    }
    expect(status).toBe('FAILED');
});
});
