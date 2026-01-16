import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

import { timelineValidator } from './validators/timeline_validator';
import { incomeValidator } from './validators/incomes_validator';
import { expenseValidator } from './validators/expenses_validator';
import { accountValidator } from './validators/accounts_validator';
import { glidePathValidator } from './validators/glide_path_validator';
import { contributionRulesValidator, baseContributionRuleValidator } from './validators/contribution_rules_validator';
import { marketAssumptionsValidator } from './validators/market_assumptions_validator';
import { taxSettingsValidator } from './validators/tax_settings_validator';
import { privacySettingsValidator } from './validators/privacy_settings_validator';
import { simulationSettingsValidator } from './validators/simulation_settings_validator';
import { assetValidator } from './validators/asset_validator';
import { liabilityValidator } from './validators/liability_validator';
import { userFeedbackValidator } from './validators/user_feedback_validator';

export default defineSchema({
  plans: defineTable({
    userId: v.string(),
    name: v.string(),
    isDefault: v.boolean(),
    timeline: v.union(timelineValidator, v.null()),
    incomes: v.array(incomeValidator),
    expenses: v.array(expenseValidator),
    accounts: v.array(accountValidator),
    glidePath: v.optional(glidePathValidator),
    contributionRules: v.array(contributionRulesValidator),
    baseContributionRule: baseContributionRuleValidator,
    marketAssumptions: marketAssumptionsValidator,
    taxSettings: taxSettingsValidator,
    privacySettings: privacySettingsValidator,
    simulationSettings: simulationSettingsValidator,
  }).index('by_userId', ['userId']),
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
  }).index('by_planId_updatedAt', ['planId', 'updatedAt']),
  messages: defineTable({
    userId: v.string(),
    conversationId: v.id('conversations'),
    author: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
    body: v.optional(v.string()),
    usage: v.optional(
      v.object({
        inputTokens: v.number(),
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
