import { v } from 'convex/values';
import { mutation } from './_generated/server';

import { contributionRulesValidator } from './validators/contribution-rules-validator';
import { getUserIdOrThrow } from './utils/auth-utils';
import { getPlanForUserIdOrThrow } from './utils/plan-utils';

export const upsertContributionRule = mutation({
  args: {
    planId: v.id('plans'),
    contributionRule: contributionRulesValidator,
  },
  handler: async (ctx, { planId, contributionRule }) => {
    const userId = await getUserIdOrThrow(ctx);
    const plan = await getPlanForUserIdOrThrow(ctx, planId, userId);

    const updatedContributionRules = [...plan.contributionRules.filter((cr) => cr.id !== contributionRule.id), contributionRule];

    await ctx.db.patch(planId, { contributionRules: updatedContributionRules });
  },
});

export const reorderContributionRules = mutation({
  args: {
    planId: v.id('plans'),
    newOrder: v.array(v.string()),
  },
  handler: async (ctx, { planId, newOrder }) => {
    const userId = await getUserIdOrThrow(ctx);
    const plan = await getPlanForUserIdOrThrow(ctx, planId, userId);

    const reorderedContributionRules = newOrder.map((id, index) => {
      const cr = plan.contributionRules.find((c) => c.id === id);
      if (!cr) throw new Error(`Contribution rule ${id} not found`);
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
    const userId = await getUserIdOrThrow(ctx);
    const plan = await getPlanForUserIdOrThrow(ctx, planId, userId);

    const updatedContributionRules = plan.contributionRules
      .filter((rule) => rule.id !== contributionRuleId)
      .map((rule, idx) => ({ ...rule, rank: idx + 1 }));

    await ctx.db.patch(planId, { contributionRules: updatedContributionRules });
  },
});
