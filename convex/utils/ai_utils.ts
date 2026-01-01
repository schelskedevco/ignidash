import { ConvexError } from 'convex/values';
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
  dailyInsightsLimit: { kind: 'fixed window', rate: 3, period: DAY },
});

function getInlineRateLimitConfigs(start: number) {
  return { monthlyGpt5CostLimit: { kind: 'fixed window' as const, rate: 5_000_000, period: MONTH, start } };
}

function calculateTokenCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens * TOKEN_COSTS.input) / 1_000_000;
  const outputCost = (outputTokens * TOKEN_COSTS.output) / 1_000_000;

  return inputCost + outputCost;
}

export async function recordUsage(
  ctx: MutationCtx,
  userId: string,
  inputTokens: number,
  outputTokens: number,
  mode: UsageMode,
  subscriptionStartTime: number
) {
  const { monthlyGpt5CostLimit } = getInlineRateLimitConfigs(subscriptionStartTime);

  const cost = calculateTokenCost(inputTokens, outputTokens);
  const costAsMicroDollars = Math.ceil(cost * 1_000_000);

  const [{ value: dailyGpt5CostLimitValue }, { value: monthlyGpt5CostLimitValue }] = await Promise.all([
    rateLimiter.getValue(ctx, 'dailyGpt5CostLimit', { key: userId }),
    rateLimiter.getValue(ctx, 'monthlyGpt5CostLimit', { key: userId, config: monthlyGpt5CostLimit }),
  ]);

  const dailyGpt5Cost = Math.max(0, Math.min(costAsMicroDollars, dailyGpt5CostLimitValue));
  const monthlyGpt5Cost = Math.max(0, Math.min(costAsMicroDollars, monthlyGpt5CostLimitValue));

  const promises = [];

  promises.push(rateLimiter.limit(ctx, 'dailyGpt5CostLimit', { key: userId, count: dailyGpt5Cost }));
  promises.push(rateLimiter.limit(ctx, 'monthlyGpt5CostLimit', { key: userId, count: monthlyGpt5Cost, config: monthlyGpt5CostLimit }));
  if (mode === 'insights') promises.push(rateLimiter.limit(ctx, 'dailyInsightsLimit', { key: userId, count: 1 }));

  await Promise.all(promises);
}

export async function checkUsageLimits(
  ctx: MutationCtx,
  userId: string,
  mode: UsageMode,
  subscriptionStartTime: number
): Promise<{ ok: boolean; retryAfter: number }> {
  const { ok: dailyOk, retryAfter: dailyRetryAfter } = await rateLimiter.check(ctx, 'dailyGpt5CostLimit', { key: userId, count: 1 });
  if (!dailyOk) return { ok: false, retryAfter: dailyRetryAfter };

  const { monthlyGpt5CostLimit } = getInlineRateLimitConfigs(subscriptionStartTime);

  const { ok: monthlyOk, retryAfter: monthlyRetryAfter } = await rateLimiter.check(ctx, 'monthlyGpt5CostLimit', {
    key: userId,
    count: 1,
    config: monthlyGpt5CostLimit,
  });
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

export async function getCanUseAIFeatures(
  ctx: QueryCtx
): Promise<{ canUseAIFeatures: boolean; isAdmin: boolean; isActiveSubscription: boolean }> {
  return await ctx.runQuery(api.auth.getCanUseAIFeatures, {});
}

export async function getSubscriptionStartTime(ctx: QueryCtx, isAdmin: boolean): Promise<number> {
  if (isAdmin) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }

  const subscriptions = await ctx.runQuery(api.auth.listSubscriptions, {});
  const activeSubscription = subscriptions?.find((subscription) => subscription.status === 'active' || subscription.status === 'trialing');

  if (!activeSubscription) throw new ConvexError('No active subscription found');
  if (!activeSubscription.periodStart) throw new ConvexError('Subscription has no start time');

  return activeSubscription.periodStart;
}
