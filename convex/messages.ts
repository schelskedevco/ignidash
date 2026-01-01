import { v, ConvexError } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { query, mutation, internalMutation } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { internal } from './_generated/api';

import { getPlanForCurrentUserOrThrow } from './utils/plan_utils';
import { getConversationForCurrentUserOrThrow } from './utils/conversation_utils';
import { getUserIdOrThrow } from './utils/auth_utils';
import { checkUsageLimits, recordUsage, getCanUseAIFeatures, getSubscriptionInfo } from './utils/ai_utils';
import { getSystemPrompt } from './utils/sys_prompt_utils';
import { keyMetricsValidator } from './validators/key_metrics_validator';

const MESSAGE_TIMEOUT_MS = 5 * 60 * 1000;
const NUM_MESSAGES_AS_CONTEXT = 5;

export const canUseChat = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx): Promise<boolean> => {
    const { canUseAIFeatures } = await getCanUseAIFeatures(ctx);
    return canUseAIFeatures;
  },
});

export const list = query({
  args: { conversationId: v.id('conversations'), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { conversationId, paginationOpts }) => {
    await getConversationForCurrentUserOrThrow(ctx, conversationId);

    return await ctx.db
      .query('messages')
      .withIndex('by_conversationId_updatedAt', (q) => q.eq('conversationId', conversationId))
      .order('desc')
      .paginate(paginationOpts);
  },
});

export const send = mutation({
  args: {
    conversationId: v.optional(v.id('conversations')),
    planId: v.id('plans'),
    content: v.string(),
    keyMetrics: v.nullable(keyMetricsValidator),
  },
  handler: async (ctx, { conversationId: currConvId, planId, content, keyMetrics }) => {
    if (content.length > 2000) throw new ConvexError('Message cannot be longer than 2,000 characters.');

    const [{ userId }, { canUseAIFeatures: canUseChat, isAdmin }] = await Promise.all([getUserIdOrThrow(ctx), getCanUseAIFeatures(ctx)]);

    if (!canUseChat) throw new ConvexError('AI chat is not available. Upgrade to start chatting.');

    const { startTime: subscriptionStartTime, type: subscriptionType } = await getSubscriptionInfo(ctx, isAdmin);

    const { ok, retryAfter } = await checkUsageLimits(ctx, userId, 'chat', subscriptionStartTime, subscriptionType);
    if (!ok) throw new ConvexError(`AI usage limit exceeded. Try again after ${new Date(Date.now() + retryAfter).toLocaleString()}.`);

    const [loadingMessage, plan] = await Promise.all([
      ctx.db
        .query('messages')
        .withIndex('by_userId_updatedAt', (q) => q.eq('userId', userId))
        .filter((q) => q.eq(q.field('isLoading'), true))
        .first(),
      getPlanForCurrentUserOrThrow(ctx, planId),
    ]);
    if (loadingMessage) throw new ConvexError('An AI chat is already in progress. Please wait for it to complete.');

    const updatedAt = Date.now();
    const systemPrompt = getSystemPrompt(plan, keyMetrics);

    let newConvId: Id<'conversations'> | null = null;
    if (!currConvId) {
      const title = content.length > 25 ? content.slice(0, 25) + '...' : content;
      newConvId = await ctx.db.insert('conversations', { userId, planId, title, updatedAt, systemPrompt });
    } else {
      await getConversationForCurrentUserOrThrow(ctx, currConvId);
    }

    const conversationId = (currConvId ?? newConvId)!;

    const userMessageId = await ctx.db.insert('messages', { userId, conversationId, author: 'user', body: content, updatedAt });
    const [assistantMessageId] = await Promise.all([
      ctx.db.insert('messages', { userId, conversationId, author: 'assistant', updatedAt: updatedAt + 1, isLoading: true }),
      ctx.db.patch(conversationId, { updatedAt }),
    ]);

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_conversationId_updatedAt', (q) => q.eq('conversationId', conversationId))
      .order('desc')
      .take(NUM_MESSAGES_AS_CONTEXT);
    messages.reverse();

    await ctx.scheduler.runAfter(0, internal.use_openai.streamChat, {
      userId,
      messages,
      assistantMessageId,
      systemPrompt,
      subscriptionStartTime,
      subscriptionType,
    });

    return { messages, userMessageId, assistantMessageId, conversationId };
  },
});

export const setBody = internalMutation({
  args: {
    messageId: v.id('messages'),
    body: v.string(),
    isLoading: v.optional(v.boolean()),
  },
  handler: async (ctx, { messageId, body, isLoading }) => {
    const updates: { body: string; updatedAt: number; isLoading?: boolean } = { body, updatedAt: Date.now() };
    if (isLoading !== undefined) updates.isLoading = isLoading;

    await ctx.db.patch(messageId, updates);
  },
});

export const setUsage = internalMutation({
  args: {
    messageId: v.id('messages'),
    userId: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    totalTokens: v.number(),
    subscriptionStartTime: v.number(),
    subscriptionType: v.union(v.literal('active'), v.literal('trialing'), v.literal('admin')),
  },
  handler: async (ctx, { messageId, userId, inputTokens, outputTokens, totalTokens, subscriptionStartTime, subscriptionType }) => {
    if (inputTokens + outputTokens !== totalTokens) {
      console.warn(`Token mismatch for message ${messageId}: ${inputTokens} + ${outputTokens} !== ${totalTokens}`);
    }

    await Promise.all([
      ctx.db.patch(messageId, { usage: { inputTokens, outputTokens, totalTokens }, updatedAt: Date.now() }),
      recordUsage(ctx, userId, inputTokens, outputTokens, 'chat', subscriptionStartTime, subscriptionType),
    ]);
  },
});

export const setIsLoading = internalMutation({
  args: {
    messageId: v.id('messages'),
    isLoading: v.boolean(),
  },
  handler: async (ctx, { messageId, isLoading }) => {
    await ctx.db.patch(messageId, { isLoading, updatedAt: Date.now() });
  },
});

export const cleanupLoadingMessages = internalMutation({
  args: {},
  handler: async (ctx) => {
    const staleLoadingMessages = await ctx.db
      .query('messages')
      .filter((q) => q.and(q.eq(q.field('isLoading'), true), q.lt(q.field('updatedAt'), Date.now() - MESSAGE_TIMEOUT_MS)))
      .collect();

    await Promise.all(
      staleLoadingMessages.map((msg) =>
        ctx.db.patch(msg._id, { isLoading: false, body: msg.body || 'This message timed out. Please try again.', updatedAt: Date.now() })
      )
    );

    if (staleLoadingMessages.length > 0) {
      console.warn(`Cleaned up ${staleLoadingMessages.length} stale loading messages`);
    }
  },
});
