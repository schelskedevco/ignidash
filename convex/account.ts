import { v4 as uuidv4 } from 'uuid';

import { v, ConvexError } from 'convex/values';
import { query, mutation } from './_generated/server';

import { accountValidator } from './validators/accounts_validator';
import { getPlanForCurrentUserOrThrow } from './utils/plan_utils';

export const getAccounts = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    return plan.accounts;
  },
});

export const getCountOfAccounts = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    return plan.accounts.length;
  },
});

export const getAccount = query({
  args: { planId: v.id('plans'), accountId: v.union(v.string(), v.null()) },
  handler: async (ctx, { planId, accountId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    const account = plan.accounts.find((acc) => acc.id === accountId);
    return account || null;
  },
});

export const getSavingsAccount = query({
  args: { planId: v.id('plans'), accountId: v.union(v.string(), v.null()) },
  handler: async (ctx, { planId, accountId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    const account = plan.accounts.find((acc) => acc.id === accountId && acc.type === 'savings');
    return account || null;
  },
});

export const getInvestmentAccount = query({
  args: { planId: v.id('plans'), accountId: v.union(v.string(), v.null()) },
  handler: async (ctx, { planId, accountId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    const account = plan.accounts.find((acc) => acc.id === accountId && acc.type !== 'savings');
    return account || null;
  },
});

export const upsertAccount = mutation({
  args: {
    planId: v.id('plans'),
    account: accountValidator,
  },
  handler: async (ctx, { planId, account }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    const updatedContributionRules = plan.contributionRules;

    const existingIndex = plan.accounts.findIndex((acc) => acc.id === account.id);
    if (existingIndex === -1) {
      if (plan.accounts.length >= 15) throw new ConvexError('Maximum of 15 accounts reached.');

      // Add a default contribution rule for the new account
      updatedContributionRules.push({
        id: uuidv4(),
        accountId: account.id,
        rank: plan.contributionRules.length + 1,
        amount: { type: 'unlimited' as const },
        disabled: false,
      });
    }

    const updatedAccounts =
      existingIndex !== -1 ? plan.accounts.map((acc, index) => (index === existingIndex ? account : acc)) : [...plan.accounts, account];

    await ctx.db.patch(planId, { accounts: updatedAccounts, contributionRules: updatedContributionRules });
  },
});

export const deleteAccount = mutation({
  args: {
    planId: v.id('plans'),
    accountId: v.string(),
  },
  handler: async (ctx, { planId, accountId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    const updatedContributionRules = plan.contributionRules
      .filter((rule) => rule.accountId !== accountId)
      .map((rule, idx) => ({ ...rule, rank: idx + 1 }));

    const updatedAccounts = plan.accounts.filter((acc) => acc.id !== accountId);

    await ctx.db.patch(planId, { accounts: updatedAccounts, contributionRules: updatedContributionRules });
  },
});
