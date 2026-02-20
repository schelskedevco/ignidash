import { test, expect } from './fixtures/console-error-fixture';

test('upgrade button initiates Stripe checkout', async ({ page }) => {
  // Intercept the upgrade API call and mock a redirect to Stripe
  const upgradeRequestPromise = page.waitForRequest((req) => req.url().includes('/api/auth/') && req.url().includes('upgrade'), {
    timeout: 10_000,
  });

  await page.route('**/api/auth/**upgrade**', (route) => {
    return route.fulfill({
      status: 302,
      headers: { location: 'https://checkout.stripe.com/test' },
    });
  });

  await page.goto('/pricing');

  // Since the test runs with authenticated state, a button (not a link) should render
  const upgradeButton = page.getByRole('button', { name: /free trial|Upgrade to Pro/i });
  await expect(upgradeButton).toBeVisible({ timeout: 10_000 });
  await upgradeButton.click();

  // Verify the upgrade API request was actually fired
  const request = await upgradeRequestPromise;
  expect(request).toBeTruthy();
});
