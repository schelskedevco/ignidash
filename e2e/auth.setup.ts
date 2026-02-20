import { test as setup, expect } from '@playwright/test';
import { SETUP_USER } from './fixtures/test-user';

setup('create authenticated session', async ({ page }) => {
  // Try signing up first; if user already exists, fall back to sign-in
  await page.goto('/signup');

  await page.getByLabel('Email address').fill(SETUP_USER.email);
  await page.getByLabel('Name').fill(SETUP_USER.name);
  await page.locator('input#password').fill(SETUP_USER.password);
  await page.getByRole('button', { name: /sign up/i }).click();

  // Wait for navigation — either dashboard (new user) or stay on page (existing user)
  await page.waitForURL(/\/(dashboard|sign)/, { timeout: 15_000 });

  const onDashboard = /\/dashboard/.test(page.url());

  if (!onDashboard) {
    // User likely already exists — sign in instead
    await page.goto('/signin');
    await page.getByLabel('Email address').fill(SETUP_USER.email);
    await page.locator('input#password').fill(SETUP_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  }

  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
