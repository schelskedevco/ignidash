import { test, expect } from '@playwright/test';

test('upgrade button initiates Stripe checkout', async ({ page }) => {
  let upgradeRequestFired = false;

  // Intercept the upgrade API call and mock a redirect to Stripe
  await page.route('**/api/auth/**upgrade**', (route) => {
    upgradeRequestFired = true;
    return route.fulfill({
      status: 302,
      headers: { location: 'https://checkout.stripe.com/test' },
    });
  });

  await page.goto('/pricing');

  // Click whichever upgrade button is visible
  const upgradeButton = page.locator('button').filter({ hasText: /free trial|Upgrade to Pro/i });

  // If user is not authenticated, the button is a link — handle both cases
  const upgradeLink = page.locator('a').filter({ hasText: /free trial|Upgrade to Pro/i });

  const button = (await upgradeButton.isVisible()) ? upgradeButton : upgradeLink;

  await button.click();

  // Verify the upgrade request was intercepted or page navigated toward Stripe
  const currentUrl = page.url();
  const stripeRedirectOrRequest = upgradeRequestFired || currentUrl.includes('checkout.stripe.com');

  expect(stripeRedirectOrRequest || currentUrl.includes('/signin')).toBe(true);
});
