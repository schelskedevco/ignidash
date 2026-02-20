import { test, expect } from '@playwright/test';

test('authenticated user sees dashboard', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).not.toBeVisible();
});
