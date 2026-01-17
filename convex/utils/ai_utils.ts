import { ConvexError } from 'convex/values';
import { RateLimiter, HOUR } from '@convex-dev/rate-limiter';

import type { QueryCtx, MutationCtx } from '../_generated/server';
import { api, components } from '../_generated/api';

type UsageMode = 'chat' | 'insights';
export type SubscriptionType = 'active' | 'trialing' | 'admin';

const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;

const TOKEN_COSTS = {
  input: 1.75,
  output: 14.0,
} as const;

// Allows $1.00 of usage per day and $5.00 of usage per month
// Using micro-dollars (millionths of a dollar) for max precision
// $1.00 = 1,000,000 micro-dollars, $5.00 = 5,000,000 micro-dollars
const rateLimiter = new RateLimiter(components.rateLimiter, {
  dailyGpt5CostLimit: { kind: 'fixed window', rate: 1_000_000, period: DAY },
  dailyInsightsLimit: { kind: 'fixed window', rate: 3, period: DAY },
});

function getInlineRateLimitConfigs(start: number) {
  return {
    weeklyGpt5CostLimit: { kind: 'fixed window' as const, rate: 2_500_000, period: WEEK, start },
    monthlyGpt5CostLimit: { kind: 'fixed window' as const, rate: 5_000_000, period: MONTH, start },
  };
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
  subscriptionStartTime: number,
  subscriptionType: SubscriptionType
) {
  const { weeklyGpt5CostLimit, monthlyGpt5CostLimit } = getInlineRateLimitConfigs(subscriptionStartTime);

  const cost = calculateTokenCost(inputTokens, outputTokens);
  const costAsMicroDollars = Math.ceil(cost * 1_000_000);

  const periodConfig = subscriptionType === 'trialing' ? weeklyGpt5CostLimit : monthlyGpt5CostLimit;
  const periodLimitName = subscriptionType === 'trialing' ? 'weeklyGpt5CostLimit' : 'monthlyGpt5CostLimit';

  const [{ value: dailyGpt5CostLimitValue }, { value: periodCostLimitValue }] = await Promise.all([
    rateLimiter.getValue(ctx, 'dailyGpt5CostLimit', { key: userId }),
    rateLimiter.getValue(ctx, periodLimitName, { key: userId, config: periodConfig }),
  ]);

  const dailyGpt5Cost = Math.max(0, Math.min(costAsMicroDollars, dailyGpt5CostLimitValue));
  const periodCost = Math.max(0, Math.min(costAsMicroDollars, periodCostLimitValue));

  const promises = [];

  promises.push(rateLimiter.limit(ctx, 'dailyGpt5CostLimit', { key: userId, count: dailyGpt5Cost }));
  promises.push(rateLimiter.limit(ctx, periodLimitName, { key: userId, count: periodCost, config: periodConfig }));
  if (mode === 'insights') promises.push(rateLimiter.limit(ctx, 'dailyInsightsLimit', { key: userId, count: 1 }));

  await Promise.all(promises);
}

export async function checkUsageLimits(
  ctx: MutationCtx,
  userId: string,
  mode: UsageMode,
  subscriptionStartTime: number,
  subscriptionType: SubscriptionType
): Promise<{ ok: boolean; retryAfter: number }> {
  const { ok: dailyOk, retryAfter: dailyRetryAfter } = await rateLimiter.check(ctx, 'dailyGpt5CostLimit', { key: userId, count: 1 });
  if (!dailyOk) return { ok: false, retryAfter: dailyRetryAfter };

  const { weeklyGpt5CostLimit, monthlyGpt5CostLimit } = getInlineRateLimitConfigs(subscriptionStartTime);

  const periodConfig = subscriptionType === 'trialing' ? weeklyGpt5CostLimit : monthlyGpt5CostLimit;
  const periodLimitName = subscriptionType === 'trialing' ? 'weeklyGpt5CostLimit' : 'monthlyGpt5CostLimit';

  const { ok: periodOk, retryAfter: periodRetryAfter } = await rateLimiter.check(ctx, periodLimitName, {
    key: userId,
    count: 1,
    config: periodConfig,
  });
  if (!periodOk) return { ok: false, retryAfter: periodRetryAfter };

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
  if (process.env.SELF_HOSTED === 'true') return { canUseAIFeatures: true, isAdmin: true, isActiveSubscription: false };

  return await ctx.runQuery(api.auth.getCanUseAIFeatures, {});
}

export async function getSubscriptionInfo(ctx: QueryCtx, isAdmin: boolean): Promise<{ startTime: number; type: SubscriptionType }> {
  if (isAdmin) {
    const now = new Date();
    return { startTime: new Date(now.getFullYear(), now.getMonth(), 1).getTime(), type: 'admin' };
  }

  const subscriptions = await ctx.runQuery(api.auth.listSubscriptions, {});

  const activeSubscription = subscriptions?.find((subscription) => subscription.status === 'active');
  if (activeSubscription) {
    if (!activeSubscription.periodStart) throw new ConvexError('Subscription has no start time');
    return { startTime: activeSubscription.periodStart, type: 'active' };
  }

  const trialSubscription = subscriptions?.find((subscription) => subscription.status === 'trialing');
  if (trialSubscription) {
    if (!trialSubscription.trialStart) throw new ConvexError('Trial has no start time');
    return { startTime: trialSubscription.trialStart, type: 'trialing' };
  }

  throw new ConvexError('No subscription found');
}
