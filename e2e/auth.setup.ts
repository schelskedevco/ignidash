import { test as setup, expect } from '@playwright/test';
import { SETUP_USER } from './fixtures/test-user';

setup('create authenticated session', async ({ page }) => {
  // Try signing up first; if user already exists, fall back to sign-in
  await page.goto('/signup');

  await page.locator('input[name="email"]').fill(SETUP_USER.email);
  await page.locator('input#full-name').fill(SETUP_USER.name);
  await page.locator('input[name="password"]').fill(SETUP_USER.password);
  await page.locator('button[type="submit"]').click();

  // Wait for the submit button to finish loading, then check where we ended up
  await page.locator('button[type="submit"]:not([disabled])').waitFor({ timeout: 15_000 });

  const onDashboard = /\/dashboard/.test(page.url());

  if (!onDashboard) {
    // User likely already exists — sign in instead
    await page.goto('/signin');
    await page.locator('input[name="email"]').fill(SETUP_USER.email);
    await page.locator('input[name="password"]').fill(SETUP_USER.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  }

  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
