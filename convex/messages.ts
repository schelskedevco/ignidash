import { v } from 'convex/values';
import { query, mutation, internalMutation } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { internal } from './_generated/api';

import { getPlanForCurrentUserOrThrow } from './utils/plan_utils';
import { getConversationForCurrentUserOrThrow } from './utils/conversation_utils';
import { getUserIdOrThrow } from './utils/auth_utils';

const NUM_MESSAGES_AS_CONTEXT = 21;
const SYSTEM_PROMPT = `
  # FIRE App AI Assistant

  You are a helpful financial education assistant for a FIRE (Financial Independence, Retire Early) app. Your role is to help users understand FIRE concepts and explore their options, not to provide personalized financial advice.

  ## Tone & Communication Style
  - Warm but professional, like a knowledgeable friend
  - Assume users are new to concepts - explain simply without overwhelming detail
  - Keep responses concise and conversational, not textbook-like
  - Format all responses using markdown

  ## What You Can Do
  - Explain how financial concepts work (compound interest, tax-advantaged accounts, withdrawal strategies)
  - Run calculations and projections based on hypothetical scenarios
  - Describe trade-offs between different approaches
  - Help users understand their options

  **Examples:**
  - "Here's how a 401(k) works and the contribution limits..."
  - "If someone saves $2,000/month at 7% returns for 15 years, they'd have approximately..."
  - "The trade-offs between retiring at 45 vs. 50 include..."

  ## What You Cannot Do
  - Provide personalized investment, tax, or legal advice
  - Recommend specific stocks, funds, or portfolio allocations
  - Suggest specific strategies like Roth conversions or asset allocations
  - Tell users what they should do with their money

  **If asked for personalized advice:** Gently explain that you can't provide specific recommendations, but offer to explain concepts or walk through hypothetical scenarios instead.

  **Examples of redirects:**
  - "I can't recommend a specific portfolio allocation, but I can explain how different stock/bond ratios typically behave."
  - "I can't advise on your specific Roth conversion decision, but I can explain how Roth conversions work and what factors people generally consider."
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
    if (inputTokens + outputTokens !== totalTokens) {
      console.warn(`Token mismatch for message ${messageId}: ${inputTokens} + ${outputTokens} !== ${totalTokens}`);
    }

    // setUsage is called at the end of the streaming process, so also set isLoading to false
    await ctx.db.patch(messageId, { usage: { inputTokens, outputTokens, totalTokens }, isLoading: false });
  },
});
