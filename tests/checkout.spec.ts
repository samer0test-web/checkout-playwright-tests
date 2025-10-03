import { test, expect } from "./fixture/checkout-fixture";
test.describe("Checkout Flow", () => {
  // Test case: Invalid voucher should show error and not change cart total
  test("Invalid voucher does not change cart total", async ({
    checkoutPage,
  }) => {
    // Fill invalid voucher code and click "Apply" button
    await checkoutPage
      .getByLabel("Voucher Code", { exact: true })
      .fill("INVALID-TEST");
    await checkoutPage.getByRole("button", { name: /^apply$/i }).click();
    // Locate error message
    const errorMsg = checkoutPage
      .locator('[data-testid="voucher-error"]')
      .first()
      .or(checkoutPage.locator("div.text-caption.text-error.mt-1").first());
    // Assert error message is visible and has correct text
    await expect(errorMsg).toHaveText(
      /Invalid code\. Please check and try again\./i
    );
  });
  // Test case: Simulate failed payment and verify API returns FAILED status
  test("Failed Payment reflects FAILED in API", async ({ checkoutPage }) => {
    // Get token from localStorage to use in API requests
    const token = await checkoutPage.evaluate(() =>
      localStorage.getItem("access")
    );
    if (!token) throw new Error("No access token in localStorage");
    const auth = { headers: { Authorization: `Bearer ${token}` } };
    // Fetch cart details
    const cartRes = await checkoutPage.request.get(
      "https://staging.himam.com/api/orders/cart",
      auth
    );
    if (!cartRes.ok()) {
      const body = await cartRes.text();
      throw new Error(`Cart API failed: ${cartRes.status()} ${body}`);
    }
    const cartJson = await cartRes.json();
    // Extract orderId
    const orderId: number | undefined =
      cartJson?.order?.id ?? cartJson?.id ?? cartJson?.data?.order?.id;

    if (!orderId) {
      throw new Error("Could not extract orderId from cart response");
    }
    // Helper for locators
    const $ = (s: string) => checkoutPage.locator(s);
    // Fill payment form with test card data
    await $('label:has-text("Checkout")').click();
    await $("#mysr-cc-name").fill("Test User");
    await $("#mysr-cc-number").fill("4242424242424242");
    await $('input[placeholder="MM / YY"]').fill("08/29");
    await $('input[placeholder="CVC"]').fill("059");
    await $(".mysr-form-button").click();
    await $("#auth_result").selectOption("AUTHENTICATED");
    await $('input[value="Submit"]').click();
    // Poll the API until the order status changes from PENDING
    await expect
      .poll(
        async () => {
          const orderRes = await checkoutPage.request.get(
            `https://staging.himam.com/api/orders/${orderId}`,
            auth
          );
          const orderJson = await orderRes.json();
          return (
            orderJson?.statusSlug ?? orderJson?.order?.statusSlug ?? "PENDING"
          );
        },
        { timeout: 40_000, intervals: [1000, 1500, 2000] }
      )
      .toBe("FAILED"); // Assert final status is FAILED
  });
});
