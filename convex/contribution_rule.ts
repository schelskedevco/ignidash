import { v, ConvexError } from 'convex/values';
import { query, mutation } from './_generated/server';

import { contributionRulesValidator, baseContributionRuleValidator } from './validators/contribution_rules_validator';
import { getPlanForCurrentUserOrThrow } from './utils/plan_utils';

export const getContributionRules = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    return plan.contributionRules;
  },
});

export const getCountOfContributionRules = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    return plan.contributionRules.length;
  },
});

export const getContributionRule = query({
  args: { planId: v.id('plans'), ruleId: v.union(v.string(), v.null()) },
  handler: async (ctx, { planId, ruleId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    const rule = plan.contributionRules.find((rule) => rule.id === ruleId);
    return rule || null;
  },
});

export const upsertContributionRule = mutation({
  args: {
    planId: v.id('plans'),
    contributionRule: contributionRulesValidator,
  },
  handler: async (ctx, { planId, contributionRule }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    const existingIndex = plan.contributionRules.findIndex((cr) => cr.id === contributionRule.id);
    if (existingIndex === -1 && plan.contributionRules.length >= 20) throw new ConvexError('Maximum of 20 contribution rules reached.');

    const updatedContributionRules =
      existingIndex !== -1
        ? plan.contributionRules.map((cr, index) => (index === existingIndex ? contributionRule : cr))
        : [...plan.contributionRules, contributionRule];

    await ctx.db.patch(planId, { contributionRules: updatedContributionRules });
  },
});

export const reorderContributionRules = mutation({
  args: {
    planId: v.id('plans'),
    newOrder: v.array(v.string()),
  },
  handler: async (ctx, { planId, newOrder }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    const reorderedContributionRules = newOrder.map((id, index) => {
      const cr = plan.contributionRules.find((c) => c.id === id);
      if (!cr) throw new ConvexError(`Contribution rule ${id} not found`);
      return { ...cr, rank: index + 1 };
    });

    await ctx.db.patch(planId, { contributionRules: reorderedContributionRules });
  },
});

export const deleteContributionRule = mutation({
  args: {
    planId: v.id('plans'),
    contributionRuleId: v.string(),
  },
  handler: async (ctx, { planId, contributionRuleId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    const updatedContributionRules = plan.contributionRules
      .filter((rule) => rule.id !== contributionRuleId)
      .map((rule, idx) => ({ ...rule, rank: idx + 1 }));

    await ctx.db.patch(planId, { contributionRules: updatedContributionRules });
  },
});

export const getBaseRule = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    return plan.baseContributionRule;
  },
});

export const updateBaseRule = mutation({
  args: {
    planId: v.id('plans'),
    baseContributionRule: baseContributionRuleValidator,
  },
  handler: async (ctx, { planId, baseContributionRule }) => {
    await getPlanForCurrentUserOrThrow(ctx, planId);

    await ctx.db.patch(planId, { baseContributionRule });
  },
});
