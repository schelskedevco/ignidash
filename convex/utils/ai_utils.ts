import { RateLimiter, HOUR } from '@convex-dev/rate-limiter';

import type { QueryCtx, MutationCtx } from '../_generated/server';
import { api, components } from '../_generated/api';

type UsageMode = 'chat' | 'insights';

const DAY = 24 * HOUR;
const MONTH = 30 * DAY;

const TOKEN_COSTS = {
  input: 1.25,
  output: 10.0,
} as const;

// Allows $1.00 of usage per day and $5.00 of usage per month
// Using micro-dollars (millionths of a dollar) for max precision
// $1.00 = 1,000,000 micro-dollars, $5.00 = 5,000,000 micro-dollars
const rateLimiter = new RateLimiter(components.rateLimiter, {
  dailyGpt5CostLimit: { kind: 'fixed window', rate: 1_000_000, period: DAY },
  monthlyGpt5CostLimit: { kind: 'fixed window', rate: 5_000_000, period: MONTH },
  dailyInsightsLimit: { kind: 'fixed window', rate: 3, period: DAY },
});

function calculateTokenCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens * TOKEN_COSTS.input) / 1_000_000;
  const outputCost = (outputTokens * TOKEN_COSTS.output) / 1_000_000;

  return inputCost + outputCost;
}

export async function recordUsage(ctx: MutationCtx, userId: string, inputTokens: number, outputTokens: number, mode: UsageMode) {
  const cost = calculateTokenCost(inputTokens, outputTokens);
  const costAsMicroDollars = Math.ceil(cost * 1_000_000);

  const promises = [];

  promises.push(rateLimiter.limit(ctx, 'dailyGpt5CostLimit', { key: userId, count: costAsMicroDollars }));
  promises.push(rateLimiter.limit(ctx, 'monthlyGpt5CostLimit', { key: userId, count: costAsMicroDollars }));
  if (mode === 'insights') promises.push(rateLimiter.limit(ctx, 'dailyInsightsLimit', { key: userId, count: 1 }));

  await Promise.all(promises);
}

export async function checkUsageLimits(ctx: MutationCtx, userId: string, mode: UsageMode): Promise<{ ok: boolean; retryAfter: number }> {
  const { ok: dailyOk, retryAfter: dailyRetryAfter } = await rateLimiter.check(ctx, 'dailyGpt5CostLimit', { key: userId, count: 0 });
  if (!dailyOk) return { ok: false, retryAfter: dailyRetryAfter };

  const { ok: monthlyOk, retryAfter: monthlyRetryAfter } = await rateLimiter.check(ctx, 'monthlyGpt5CostLimit', { key: userId, count: 0 });
  if (!monthlyOk) return { ok: false, retryAfter: monthlyRetryAfter };

  if (mode === 'insights') {
    const { ok: insightsOk, retryAfter: insightsRetryAfter } = await rateLimiter.check(ctx, 'dailyInsightsLimit', {
      key: userId,
      count: 1,
    });
    if (!insightsOk) return { ok: false, retryAfter: insightsRetryAfter };
  }

  return { ok: true, retryAfter: 0 };
}

export async function getCanUseAIFeatures(ctx: QueryCtx): Promise<boolean> {
  return await ctx.runQuery(api.auth.getCanUseAIFeatures, {});
}
