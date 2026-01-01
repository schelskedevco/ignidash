import { v, ConvexError } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { query, mutation, internalMutation } from './_generated/server';
import { internal } from './_generated/api';

import { getUserIdOrThrow } from './utils/auth_utils';
import { checkUsageLimits, recordUsage, getCanUseAIFeatures, getSubscriptionInfo } from './utils/ai_utils';
import { getPlanForCurrentUserOrThrow } from './utils/plan_utils';
import { getInsightsSystemPrompt } from './utils/sys_prompt_utils';
import { keyMetricsValidator } from './validators/key_metrics_validator';
import { simulationResultValidator } from './validators/simulation_result_validator';

export const canUseInsights = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx): Promise<boolean> => {
    const { canUseAIFeatures } = await getCanUseAIFeatures(ctx);
    return canUseAIFeatures;
  },
});

export const list = query({
  args: {
    planId: v.id('plans'),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { planId, paginationOpts }) => {
    await getPlanForCurrentUserOrThrow(ctx, planId);

    return await ctx.db
      .query('insights')
      .withIndex('by_planId_updatedAt', (q) => q.eq('planId', planId))
      .order('desc')
      .paginate(paginationOpts);
  },
});

export const getCountOfInsights = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    await getPlanForCurrentUserOrThrow(ctx, planId);

    return (
      await ctx.db
        .query('insights')
        .withIndex('by_planId_updatedAt', (q) => q.eq('planId', planId))
        .collect()
    ).length;
  },
});

export const generate = mutation({
  args: {
    planId: v.id('plans'),
    keyMetrics: keyMetricsValidator,
    simulationResult: simulationResultValidator,
    userPrompt: v.optional(v.string()),
  },
  handler: async (ctx, { planId, keyMetrics, simulationResult, userPrompt }) => {
    if (userPrompt && userPrompt.length > 250) throw new ConvexError('Supplemental prompt cannot be longer than 250 characters.');

    const [{ userId }, { canUseAIFeatures: canUseInsights, isAdmin }] = await Promise.all([
      getUserIdOrThrow(ctx),
      getCanUseAIFeatures(ctx),
    ]);

    if (!canUseInsights) throw new ConvexError('AI insights are not available. Upgrade to start generating insights.');

    const { startTime: subscriptionStartTime, type: subscriptionType } = await getSubscriptionInfo(ctx, isAdmin);

    const { ok, retryAfter } = await checkUsageLimits(ctx, userId, 'insights', subscriptionStartTime, subscriptionType);
    if (!ok) throw new ConvexError(`AI usage limit exceeded. Try again after ${new Date(Date.now() + retryAfter).toLocaleString()}.`);

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
    const systemPrompt = getInsightsSystemPrompt(plan, keyMetrics, simulationResult, userPrompt);

    const insightId = await ctx.db.insert('insights', { userId, planId, systemPrompt, content: '', updatedAt, isLoading: true });
    await ctx.scheduler.runAfter(0, internal.use_openai.streamInsights, {
      userId,
      insightId,
      systemPrompt,
      subscriptionStartTime,
      subscriptionType,
    });

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
    subscriptionStartTime: v.number(),
    subscriptionType: v.union(v.literal('active'), v.literal('trialing'), v.literal('admin')),
  },
  handler: async (ctx, { insightId, userId, inputTokens, outputTokens, totalTokens, subscriptionStartTime, subscriptionType }) => {
    if (inputTokens + outputTokens !== totalTokens) {
      console.warn(`Token mismatch for insight ${insightId}: ${inputTokens} + ${outputTokens} !== ${totalTokens}`);
    }

    await Promise.all([
      ctx.db.patch(insightId, { usage: { inputTokens, outputTokens, totalTokens }, updatedAt: Date.now() }),
      recordUsage(ctx, userId, inputTokens, outputTokens, 'insights', subscriptionStartTime, subscriptionType),
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
