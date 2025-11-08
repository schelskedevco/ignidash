import { v4 as uuidv4 } from 'uuid';

import { v } from 'convex/values';
import { mutation } from './_generated/server';

import { accountValidator } from './validators/accounts-validator';
import { getUserIdOrThrow } from './utils/auth-utils';
import { getPlanForUserIdOrThrow } from './utils/plan-utils';

export const upsertAccount = mutation({
  args: {
    planId: v.id('plans'),
    account: accountValidator,
  },
  handler: async (ctx, { planId, account }) => {
    const userId = await getUserIdOrThrow(ctx);
    const plan = await getPlanForUserIdOrThrow(ctx, planId, userId);

    const updatedContributionRules = plan.contributionRules;

    const accountExists = plan.accounts.find((acc) => acc.id === account.id);
    if (!accountExists) {
      // Add a default contribution rule for the new account
      updatedContributionRules.push({
        id: uuidv4(),
        accountId: account.id,
        rank: plan.contributionRules.length + 1,
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
    const userId = await getUserIdOrThrow(ctx);
    const plan = await getPlanForUserIdOrThrow(ctx, planId, userId);

    const updatedContributionRules = plan.contributionRules
      .filter((rule) => rule.accountId !== accountId)
      .map((rule, idx) => ({ ...rule, rank: idx + 1 }));

    const updatedAccounts = plan.accounts.filter((acc) => acc.id !== accountId);

    await ctx.db.patch(planId, { accounts: updatedAccounts, contributionRules: updatedContributionRules });
  },
});
