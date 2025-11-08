import { v4 as uuidv4 } from 'uuid';

import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { authComponent } from './auth';

import { accountValidator } from './validators/accounts-validator';

export const upsertAccount = mutation({
  args: {
    planId: v.id('plans'),
    account: accountValidator,
  },
  handler: async (ctx, { planId, account }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    const userId = user?._id;

    if (!userId) throw new Error('User not authenticated');

    const plan = await ctx.db.get(planId);

    if (!plan) throw new Error('Plan not found');
    if (plan.userId !== userId) throw new Error('Not authorized to update this plan');

    const updatedContributionRules = plan.contributionRules;

    const accountExists = plan.accounts.find((acc) => acc.id === account.id);
    if (!accountExists) {
      const contributionRulesCount = plan.contributionRules.length;

      updatedContributionRules.push({
        id: uuidv4(),
        accountId: account.id,
        rank: contributionRulesCount + 1,
        amount: { type: 'unlimited' as const },
        disabled: false,
      });
    }

    const updatedAccounts = [...plan.accounts.filter((acc) => acc.id !== account.id), account];

    await ctx.db.patch(planId, { accounts: updatedAccounts, contributionRules: updatedContributionRules });
  },
});

export const deleteAccount = mutation({
  args: {
    planId: v.id('plans'),
    accountId: v.string(),
  },
  handler: async (ctx, { planId, accountId }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    const userId = user?._id;

    if (!userId) throw new Error('User not authenticated');

    const plan = await ctx.db.get(planId);

    if (!plan) throw new Error('Plan not found');
    if (plan.userId !== userId) throw new Error('Not authorized to update this plan');

    const updatedContributionRules = plan.contributionRules
      .filter((rule) => rule.accountId !== accountId)
      .map((rule, idx) => ({ ...rule, rank: idx + 1 }));

    const updatedAccounts = plan.accounts.filter((acc) => acc.id !== accountId);

    await ctx.db.patch(planId, { accounts: updatedAccounts, contributionRules: updatedContributionRules });
  },
});
