import { test, expect } from './fixtures/console-error-fixture';
import { SETUP_USER } from './fixtures/test-user';

// These tests use a fresh browser context (no saved auth state)
test.use({ storageState: { cookies: [], origins: [] } });

test('sign-up redirects to dashboard without errors', async ({ page }) => {
  const uniqueEmail = `e2e-signup-${Date.now()}@ignidash.test`;

  await page.goto('/signup');
  await page.getByLabel('Email address').fill(uniqueEmail);
  await page.getByLabel('Name').fill('Signup Test User');
  await page.locator('input#password').fill('SignupTest123!');
  await page.getByRole('button', { name: /sign up/i }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
});

test('sign-in redirects to dashboard without errors', async ({ page }) => {
  await page.goto('/signin');
  await page.getByLabel('Email address').fill(SETUP_USER.email);
  await page.locator('input#password').fill(SETUP_USER.password);
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
});

test('unauthenticated user on /dashboard redirected to /signin', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/signin/, { timeout: 15_000 });
});
