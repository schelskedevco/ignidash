import { ConvexError } from 'convex/values';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Id, Doc } from '../_generated/dataModel';

import { getAllPlansForUser } from './plan_utils';

export async function getConversationForCurrentUserOrThrow(
  ctx: QueryCtx,
  conversationId: Id<'conversations'>
): Promise<Doc<'conversations'>> {
  const [identity, conversation] = await Promise.all([ctx.auth.getUserIdentity(), ctx.db.get(conversationId)]);

  const userId = identity?.subject;

  if (!conversation) throw new ConvexError('Conversation not found');
  if (conversation.userId !== userId) throw new ConvexError('Not authorized to access this conversation');

  return conversation;
}

async function getAllConversationsForPlan(ctx: QueryCtx, planId: Id<'plans'>): Promise<Doc<'conversations'>[]> {
  return await ctx.db
    .query('conversations')
    .withIndex('by_planId_updatedAt', (q) => q.eq('planId', planId))
    .collect();
}

export async function deleteAllConversationsForPlan(ctx: MutationCtx, planId: Id<'plans'>): Promise<void> {
  const conversations = await getAllConversationsForPlan(ctx, planId);

  const messagesByConversation = await Promise.all(
    conversations.map((conv) =>
      ctx.db
        .query('messages')
        .withIndex('by_conversationId_updatedAt', (q) => q.eq('conversationId', conv._id))
        .collect()
    )
  );

  await Promise.all([
    ...messagesByConversation.flat().map((msg) => ctx.db.delete(msg._id)),
    ...conversations.map((conv) => ctx.db.delete(conv._id)),
  ]);
}

export async function deleteAllConversationsForUser(ctx: MutationCtx, userId: string): Promise<void> {
  const plans = await getAllPlansForUser(ctx, userId);
  await Promise.all(plans.map((plan) => deleteAllConversationsForPlan(ctx, plan._id)));
}
