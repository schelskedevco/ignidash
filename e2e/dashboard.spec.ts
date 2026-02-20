import { test, expect } from './fixtures/console-error-fixture';

test('authenticated user sees dashboard', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/dashboard/);

  // Proves PlansList rendered
  await expect(page.getByRole('heading', { name: 'Plans' })).toBeVisible();

  // Proves interactive content loaded
  await expect(page.getByRole('button', { name: /create/i })).toBeVisible();

  // Proves auth wrapper passed
  await expect(page.getByText('Not authenticated')).not.toBeVisible();

  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).not.toBeVisible();
});
