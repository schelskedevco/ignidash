import { test as base, expect } from '@playwright/test';

/** Patterns for console errors that are safe to ignore. */
const IGNORED_CONSOLE_PATTERNS = [
  /posthog/i,
  /vercel.*analytics/i,
  /react.*devtools/i,
  /favicon\.ico/i,
  /hydration/i,
  /ERR_BLOCKED_BY_CLIENT/, // ad-blockers
];

/** Patterns for uncaught page errors that are safe to ignore. */
const IGNORED_PAGE_ERROR_PATTERNS = [...IGNORED_CONSOLE_PATTERNS];

function isIgnored(message: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(message));
}

type ErrorFixtures = {
  consoleErrors: string[];
  pageErrors: Error[];
};

export const test = base.extend<ErrorFixtures>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (!isIgnored(text, IGNORED_CONSOLE_PATTERNS)) {
            errors.push(text);
          }
        }
      });

      await use(errors);

      expect(errors, `Unexpected console errors:\n${errors.join('\n')}`).toHaveLength(0);
    },
    { auto: true },
  ],

  pageErrors: [
    async ({ page }, use) => {
      const errors: Error[] = [];

      page.on('pageerror', (error) => {
        if (!isIgnored(error.message, IGNORED_PAGE_ERROR_PATTERNS)) {
          errors.push(error);
        }
      });

      await use(errors);

      expect(
        errors.map((e) => e.message),
        `Uncaught page errors:\n${errors.map((e) => e.message).join('\n')}`
      ).toHaveLength(0);
    },
    { auto: true },
  ],
});

export { expect };
