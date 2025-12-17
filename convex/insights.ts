import { v, ConvexError } from 'convex/values';
import { query, mutation, internalMutation } from './_generated/server';
import { internal } from './_generated/api';

import { getUserIdOrThrow } from './utils/auth_utils';
import { checkUsageLimits, recordUsage, getCanUseChat } from './utils/ai_utils';
import { getPlanForCurrentUserOrThrow } from './utils/plan_utils';
import { getInsightsSystemPrompt } from './utils/sys_prompt_utils';
import { keyMetricsValidator } from './validators/key_metrics_validator';

export const canUseInsights = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx): Promise<boolean> => {
    return await getCanUseChat(ctx);
  },
});

export const get = query({
  args: {
    planId: v.id('plans'),
  },
  handler: async (ctx, { planId }) => {
    await getPlanForCurrentUserOrThrow(ctx, planId);

    return await ctx.db
      .query('insights')
      .withIndex('by_planId_updatedAt', (q) => q.eq('planId', planId))
      .order('desc')
      .first();
  },
});

export const generate = mutation({
  args: {
    planId: v.id('plans'),
    keyMetrics: keyMetricsValidator,
    userPrompt: v.optional(v.string()),
  },
  handler: async (ctx, { planId, keyMetrics, userPrompt }) => {
    const [{ userId }, canUseInsights] = await Promise.all([getUserIdOrThrow(ctx), getCanUseChat(ctx)]);

    if (!canUseInsights) throw new ConvexError('AI insights are not available. Upgrade to start generating insights.');

    const { ok, retryAfter } = await checkUsageLimits(ctx, userId);
    if (!ok) throw new ConvexError(`AI usage limit exceeded. Try again after ${new Date(retryAfter).toLocaleString()}.`);

    const [loadingInsight, plan] = await Promise.all([
      ctx.db
        .query('insights')
        .withIndex('by_userId_updatedAt', (q) => q.eq('userId', userId))
        .filter((q) => q.eq(q.field('isLoading'), true))
        .first(),
      getPlanForCurrentUserOrThrow(ctx, planId),
    ]);
    if (loadingInsight) throw new ConvexError('An AI insight is already in progress. Please wait for it to complete.');

    const updatedAt = Date.now();
    const systemPrompt = getInsightsSystemPrompt(plan, keyMetrics, userPrompt);

    const insightId = await ctx.db.insert('insights', { userId, planId, systemPrompt, content: '', updatedAt, isLoading: true });
    await ctx.scheduler.runAfter(0, internal.use_openai.streamInsights, { userId, insightId, systemPrompt });

    return { insightId };
  },
});

export const setContent = internalMutation({
  args: {
    insightId: v.id('insights'),
    content: v.string(),
    isLoading: v.optional(v.boolean()),
  },
  handler: async (ctx, { insightId, content, isLoading }) => {
    const updates: { content: string; updatedAt: number; isLoading?: boolean } = { content, updatedAt: Date.now() };
    if (isLoading !== undefined) updates.isLoading = isLoading;

    await ctx.db.patch(insightId, updates);
  },
});

export const setUsage = internalMutation({
  args: {
    insightId: v.id('insights'),
    userId: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    totalTokens: v.number(),
  },
  handler: async (ctx, { insightId, userId, inputTokens, outputTokens, totalTokens }) => {
    if (inputTokens + outputTokens !== totalTokens) {
      console.warn(`Token mismatch for insight ${insightId}: ${inputTokens} + ${outputTokens} !== ${totalTokens}`);
    }

    await Promise.all([
      ctx.db.patch(insightId, { usage: { inputTokens, outputTokens, totalTokens }, updatedAt: Date.now() }),
      recordUsage(ctx, userId, inputTokens, outputTokens),
    ]);
  },
});

export const setIsLoading = internalMutation({
  args: {
    insightId: v.id('insights'),
    isLoading: v.boolean(),
  },
  handler: async (ctx, { insightId, isLoading }) => {
    await ctx.db.patch(insightId, { isLoading, updatedAt: Date.now() });
  },
});
