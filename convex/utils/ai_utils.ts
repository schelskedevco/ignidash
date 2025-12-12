import { RateLimiter, HOUR } from '@convex-dev/rate-limiter';

import type { MutationCtx } from '../_generated/server';
import { components } from '../_generated/api';

const DAY = 24 * HOUR;
const MONTH = 30 * DAY;

const TOKEN_COSTS = {
  input: 1.25,
  output: 10.0,
} as const;

const rateLimiter = new RateLimiter(components.rateLimiter, {
  dailyLimit: { kind: 'fixed window', rate: 100, period: DAY },
  monthlyLimit: { kind: 'fixed window', rate: 500, period: MONTH },
});

function calculateTokenCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens * TOKEN_COSTS.input) / 1_000_000;
  const outputCost = (outputTokens * TOKEN_COSTS.output) / 1_000_000;

  return inputCost + outputCost;
}

export async function recordUsage(ctx: MutationCtx, userId: string, inputTokens: number, outputTokens: number) {
  const cost = calculateTokenCost(inputTokens, outputTokens);
  const costAsCents = Math.ceil(cost * 100);

  await Promise.all([
    rateLimiter.limit(ctx, 'dailyLimit', { key: userId, count: costAsCents }),
    rateLimiter.limit(ctx, 'monthlyLimit', { key: userId, count: costAsCents }),
  ]);
}

export async function checkUsageLimits(ctx: MutationCtx, userId: string): Promise<{ ok: boolean; retryAfter: number }> {
  const { ok: dailyOk, retryAfter: dailyRetryAfter } = await rateLimiter.check(ctx, 'dailyLimit', { key: userId, count: 0 });
  if (!dailyOk) return { ok: false, retryAfter: dailyRetryAfter };

  const { ok: monthlyOk, retryAfter: monthlyRetryAfter } = await rateLimiter.check(ctx, 'monthlyLimit', { key: userId, count: 0 });
  if (!monthlyOk) return { ok: false, retryAfter: monthlyRetryAfter };

  return { ok: true, retryAfter: 0 };
}
