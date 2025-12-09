import { v } from 'convex/values';
import { query, mutation, internalMutation } from './_generated/server';
import type { Id } from './_generated/dataModel';

import { getPlanForCurrentUserOrThrow } from './utils/plan_utils';
import { getUserIdOrThrow } from './utils/auth_utils';

export const list = query({
  args: { conversationId: v.id('conversations'), planId: v.id('plans') },
  handler: async (ctx, { conversationId, planId }) => {
    await getPlanForCurrentUserOrThrow(ctx, planId);

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_conversationId_updatedAt', (q) => q.eq('conversationId', conversationId))
      .order('asc')
      .collect();

    return messages;
  },
});

export const send = mutation({
  args: {
    conversationId: v.optional(v.id('conversations')),
    planId: v.id('plans'),
    content: v.string(),
  },
  handler: async (ctx, { conversationId: convId, planId, content }) => {
    const [{ userId }] = await Promise.all([getUserIdOrThrow(ctx), getPlanForCurrentUserOrThrow(ctx, planId)]);

    let newConversationId: Id<'conversations'> | null = null;
    if (!convId) {
      const title = content.length > 25 ? content.slice(0, 25) + '...' : content;
      newConversationId = await ctx.db.insert('conversations', { userId, planId, title, updatedAt: Date.now(), systemPrompt: undefined });
    }

    const conversationId = (convId ?? newConversationId)!;
    const [userMessageId, assistantMessageId] = await Promise.all([
      ctx.db.insert('messages', { userId, conversationId, author: 'user', body: content, updatedAt: Date.now() }),
      ctx.db.insert('messages', { userId, conversationId, author: 'assistant', updatedAt: Date.now() }),
      ctx.db.patch(conversationId, { updatedAt: Date.now() }),
    ]);

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_conversationId_updatedAt', (q) => q.eq('conversationId', conversationId))
      .order('asc')
      .take(21);

    return { messages, userMessageId, assistantMessageId, conversationId };
  },
});

export const update = internalMutation({
  args: {
    messageId: v.id('messages'),
    body: v.string(),
  },
  handler: async (ctx, { messageId, body }) => {
    await ctx.db.patch(messageId, { body, updatedAt: Date.now() });
  },
});
