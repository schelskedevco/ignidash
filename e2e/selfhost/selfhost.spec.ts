import { test, expect } from '../fixtures/console-error-fixture';

// Runs only via playwright.selfhost.config.ts against a Docker Compose deployment.
// Proves the browser reaches the self-hosted Convex backend at the public URL from
// .env.local (NEXT_PUBLIC_CONVEX_URL), not only the Next.js server.

const convexUrl = process.env.SELFHOST_CONVEX_URL;

test.use({ storageState: { cookies: [], origins: [] } });

test('browser syncs data with the self-hosted Convex backend', async ({ page }) => {
  expect(convexUrl, 'SELFHOST_CONVEX_URL must be set').toBeTruthy();
  const expectedSocketOrigin = new URL(convexUrl!.replace(/^http/, 'ws')).origin;

  const socketOrigins: string[] = [];
  page.on('websocket', (socket) => socketOrigins.push(new URL(socket.url()).origin));

  const email = `selfhost-${Date.now()}@ignidash.test`;
  await page.goto('/signup');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Name').fill('Selfhost Browser User');
  await page.locator('input#password').fill('SelfhostBrowser123!');
  await page.getByRole('button', { name: /sign up/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });

  // Create a plan through the UI: a Convex mutation followed by a reactive query update.
  const planName = `Selfhost Plan ${Date.now()}`;
  // New accounts start with the onboarding panel open.
  await page.getByRole('button', { name: "OK, let's go!" }).click();
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name').fill(planName);
  await dialog.getByRole('button', { name: /create|save/i }).click();
  await expect(page.getByText(planName, { exact: true }).filter({ visible: true }).first()).toBeVisible({ timeout: 30_000 });

  // The plan survives a full reload, so it was stored in Convex rather than local state.
  await page.reload();
  await expect(page.getByText(planName, { exact: true }).filter({ visible: true }).first()).toBeVisible({ timeout: 30_000 });

  expect(socketOrigins, `browser opened no WebSocket to ${expectedSocketOrigin}`).toContain(expectedSocketOrigin);
});
