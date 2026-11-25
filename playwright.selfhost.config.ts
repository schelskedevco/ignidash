import { defineConfig, devices } from '@playwright/test';

// Browser tests against a running Docker Compose self-host deployment.
// Usage: SELFHOST_BASE_URL=http://localhost:3000 SELFHOST_CONVEX_URL=http://localhost:3210 \
//          npx playwright test --config playwright.selfhost.config.ts
// Used by scripts/selfhost.e2e.sh and the selfhost-e2e CI job.

const baseURL = process.env.SELFHOST_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  testMatch: ['auth.setup.ts', 'auth.spec.ts', 'dashboard.spec.ts', 'selfhost/*.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    // The reverse-proxy scenario uses a locally issued certificate.
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      testIgnore: /auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
