import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

import { planDataFields } from './validators/plan_data_fields';
import { assetValidator } from './validators/asset_validator';
import { liabilityValidator } from './validators/liability_validator';
import { userFeedbackValidator } from './validators/user_feedback_validator';

export default defineSchema({
  plans: defineTable({
    userId: v.string(),
    name: v.string(),
    isDefault: v.boolean(),
    ...planDataFields,
  }).index('by_userId', ['userId']),
  planSnapshots: defineTable({
    planId: v.id('plans'),
    userId: v.string(),
    ...planDataFields,
  })
    .index('by_planId', ['planId'])
    .index('by_userId', ['userId']),
  finances: defineTable({
    userId: v.string(),
    assets: v.array(assetValidator),
    liabilities: v.array(liabilityValidator),
  }).index('by_userId', ['userId']),
  conversations: defineTable({
    userId: v.string(),
    planId: v.id('plans'),
    title: v.string(),
    updatedAt: v.number(),
    systemPrompt: v.optional(v.string()),
    includeSimData: v.optional(v.boolean()),
  }).index('by_planId_updatedAt', ['planId', 'updatedAt']),
  messages: defineTable({
    userId: v.string(),
    conversationId: v.id('conversations'),
    author: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
    body: v.optional(v.string()),
    usage: v.optional(
      v.object({
        inputTokens: v.number(),
        cachedInputTokens: v.optional(v.number()),
        outputTokens: v.number(),
        totalTokens: v.number(),
      })
    ),
    updatedAt: v.number(),
    ms: v.optional(v.number()),
    isLoading: v.optional(v.boolean()),
  })
    .index('by_conversationId_updatedAt', ['conversationId', 'updatedAt'])
    .index('by_userId_updatedAt', ['userId', 'updatedAt']),
  userFeedback: defineTable({ userId: v.string(), feedback: userFeedbackValidator }).index('by_userId', ['userId']),
  insights: defineTable({
    userId: v.string(),
    planId: v.id('plans'),
    systemPrompt: v.optional(v.string()),
    content: v.string(),
    usage: v.optional(
      v.object({
        inputTokens: v.number(),
        cachedInputTokens: v.optional(v.number()),
        outputTokens: v.number(),
        totalTokens: v.number(),
      })
    ),
    updatedAt: v.number(),
    ms: v.optional(v.number()),
    isLoading: v.optional(v.boolean()),
  })
    .index('by_planId_updatedAt', ['planId', 'updatedAt'])
    .index('by_userId_updatedAt', ['userId', 'updatedAt']),
  onboarding: defineTable({
    userId: v.string(),
    onboardingDialogCompleted: v.boolean(),
  }).index('by_userId', ['userId']),
});
