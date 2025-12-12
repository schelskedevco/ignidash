import { v, ConvexError } from 'convex/values';
import { query, mutation, internalMutation } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { internal } from './_generated/api';

import { getPlanForCurrentUserOrThrow } from './utils/plan_utils';
import { getConversationForCurrentUserOrThrow } from './utils/conversation_utils';
import { getUserIdOrThrow } from './utils/auth_utils';
import { checkUsageLimits, recordUsage } from './utils/ai_utils';

const NUM_MESSAGES_AS_CONTEXT = 5;
const SYSTEM_PROMPT = `
  You are an AI assistant for Ignidash, a FIRE (Financial Independence, Retire Early) planning app.

  ## Constraints
  - Not a licensed financial advisor—use exploratory language ("you might consider," "options include") not prescriptive ("you should," "I recommend")
  - For personalized advice (specific tax strategies, investment picks, legal matters), briefly suggest consulting a professional
  - Note that tax laws change; users should verify current rules
  - Stay on retirement/FIRE/financial independence topics; politely redirect off-topic questions

  ## App Context
  Users configure: timeline (age, life expectancy, retirement), income/expenses, accounts (savings, brokerage, 401(k), Roth, IRA, HSA with stocks/bonds/cash), contribution rules, market assumptions, and tax settings.

  The app generates projections showing portfolio value, cash flow, taxes, returns, contributions, and withdrawals—either as single simulations or Monte Carlo (500 runs, P10-P90 percentiles).

  ## User's Current Plan
  {{USER_PLAN_DATA}}

  Use this data to provide relevant, contextual responses. You may reference specific numbers to explain concepts, illustrate trade-offs, or answer questions—but frame insights as educational, not advice.

  ## Style
  - Concise, friendly, beginner-friendly
  - Markdown formatting
  - Explain financial terms briefly in plain language
  - Encourage users to model scenarios in the app to see impact
`;

export const list = query({
  args: { conversationId: v.optional(v.id('conversations')) },
  handler: async (ctx, { conversationId }) => {
    if (!conversationId) return [];

    await getConversationForCurrentUserOrThrow(ctx, conversationId);

    return await ctx.db
      .query('messages')
      .withIndex('by_conversationId_updatedAt', (q) => q.eq('conversationId', conversationId))
      .order('asc')
      .collect();
  },
});

export const send = mutation({
  args: {
    conversationId: v.optional(v.id('conversations')),
    planId: v.id('plans'),
    content: v.string(),
  },
  handler: async (ctx, { conversationId: currConvId, planId, content }) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const { ok, retryAfter } = await checkUsageLimits(ctx, userId);
    if (!ok) throw new ConvexError(`AI usage limit exceeded. Try again after ${new Date(retryAfter).toLocaleString()}.`);

    const loadingMessage = await ctx.db
      .query('messages')
      .withIndex('by_userId_updatedAt', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('isLoading'), true))
      .first();
    if (loadingMessage) throw new ConvexError('An AI chat is already in progress. Please wait for it to complete.');

    let newConvId: Id<'conversations'> | null = null;
    if (!currConvId) {
      await getPlanForCurrentUserOrThrow(ctx, planId);

      const title = content.length > 25 ? content.slice(0, 25) + '...' : content;
      newConvId = await ctx.db.insert('conversations', { userId, planId, title, updatedAt: Date.now(), systemPrompt: SYSTEM_PROMPT });
    } else {
      await getConversationForCurrentUserOrThrow(ctx, currConvId);
    }

    const conversationId = (currConvId ?? newConvId)!;

    const userMessageId = await ctx.db.insert('messages', { userId, conversationId, author: 'user', body: content, updatedAt: Date.now() });
    const [assistantMessageId] = await Promise.all([
      ctx.db.insert('messages', { userId, conversationId, author: 'assistant', updatedAt: Date.now(), isLoading: true }),
      ctx.db.patch(conversationId, { updatedAt: Date.now() }),
    ]);

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_conversationId_updatedAt', (q) => q.eq('conversationId', conversationId))
      .order('desc')
      .take(NUM_MESSAGES_AS_CONTEXT);
    messages.reverse();

    await ctx.scheduler.runAfter(0, internal.use_openai.streamChat, { messages, assistantMessageId, systemPrompt: SYSTEM_PROMPT });

    return { messages, userMessageId, assistantMessageId, conversationId };
  },
});

export const update = internalMutation({
  args: {
    messageId: v.id('messages'),
    body: v.string(),
    isLoading: v.optional(v.boolean()),
  },
  handler: async (ctx, { messageId, body, isLoading }) => {
    await ctx.db.patch(messageId, { body, updatedAt: Date.now(), isLoading });
  },
});

export const setUsage = internalMutation({
  args: {
    messageId: v.id('messages'),
    inputTokens: v.number(),
    outputTokens: v.number(),
    totalTokens: v.number(),
  },
  handler: async (ctx, { messageId, inputTokens, outputTokens, totalTokens }) => {
    const { userId } = await getUserIdOrThrow(ctx);

    if (inputTokens + outputTokens !== totalTokens) {
      console.warn(`Token mismatch for message ${messageId}: ${inputTokens} + ${outputTokens} !== ${totalTokens}`);
    }

    await Promise.all([
      ctx.db.patch(messageId, { usage: { inputTokens, outputTokens, totalTokens }, isLoading: false }),
      recordUsage(ctx, userId, inputTokens, outputTokens),
    ]);
  },
});
