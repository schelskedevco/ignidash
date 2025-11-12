import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { Doc } from './_generated/dataModel';

import { getUserIdOrThrow } from './utils/auth_utils';
import { getPlanForUserIdOrThrow } from './utils/plan_utils';
import { timelineValidator } from './validators/timeline_validator';
import { incomeValidator } from './validators/incomes_validator';
import { expenseValidator } from './validators/expenses_validator';
import { accountValidator } from './validators/accounts_validator';
import { contributionRulesValidator, baseContributionRuleValidator } from './validators/contribution_rules_validator';
import { marketAssumptionsValidator } from './validators/market_assumptions_validator';
import { api } from './_generated/api';
import { basicTemplate } from './templates/basic';
import { earlyRetirementTemplate } from './templates/early_retirement';

export const listPlans = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const plans = await ctx.db
      .query('plans')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect();

    return plans;
  },
});

export const getCountOfPlans = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const plans = await ctx.db
      .query('plans')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect();

    return plans.length;
  },
});

export const getPlan = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const plan = await ctx.db.get(planId);

    if (!plan) throw new Error('Plan not found');
    if (plan.userId !== userId) throw new Error('Not authorized to access this plan');

    return plan;
  },
});

export const getOrCreateDefaultPlan = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId, userName } = await getUserIdOrThrow(ctx);

    const existingPlan = await ctx.db
      .query('plans')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first();
    if (existingPlan) return existingPlan._id;

    return await ctx.db.insert('plans', {
      userId,
      name: `${userName}'s Plan`,
      timeline: null,
      incomes: [],
      expenses: [],
      accounts: [],
      contributionRules: [],
      baseContributionRule: { type: 'save' },
      marketAssumptions: { stockReturn: 10, stockYield: 3.5, bondReturn: 5, bondYield: 4.5, cashReturn: 3, inflationRate: 3 },
    });
  },
});

export const createBlankPlan = mutation({
  args: { newPlanName: v.string() },
  handler: async (ctx, { newPlanName }) => {
    const { userId } = await getUserIdOrThrow(ctx);

    return await ctx.db.insert('plans', {
      userId,
      name: newPlanName,
      timeline: null,
      incomes: [],
      expenses: [],
      accounts: [],
      contributionRules: [],
      baseContributionRule: { type: 'save' },
      marketAssumptions: { stockReturn: 10, stockYield: 3.5, bondReturn: 5, bondYield: 4.5, cashReturn: 3, inflationRate: 3 },
    });
  },
});

export const createPlanWithData = mutation({
  args: {
    newPlanName: v.string(),
    timeline: v.union(timelineValidator, v.null()),
    incomes: v.array(incomeValidator),
    expenses: v.array(expenseValidator),
    accounts: v.array(accountValidator),
    contributionRules: v.array(contributionRulesValidator),
    baseContributionRule: baseContributionRuleValidator,
    marketAssumptions: marketAssumptionsValidator,
  },
  handler: async (
    ctx,
    { newPlanName, timeline, incomes, expenses, accounts, contributionRules, baseContributionRule, marketAssumptions }
  ) => {
    const { userId } = await getUserIdOrThrow(ctx);

    return await ctx.db.insert('plans', {
      userId,
      name: newPlanName,
      timeline,
      incomes,
      expenses,
      accounts,
      contributionRules,
      baseContributionRule,
      marketAssumptions,
    });
  },
});

export const clonePlan = mutation({
  args: { newPlanName: v.string(), planId: v.union(v.id('plans'), v.literal('template1'), v.literal('template2')) },
  handler: async (ctx, { newPlanName, planId }) => {
    const { userId } = await getUserIdOrThrow(ctx);

    let plan: Omit<Doc<'plans'>, '_id' | '_creationTime' | 'userId' | 'name'>;
    if (planId === 'template1') {
      plan = basicTemplate;
    } else if (planId === 'template2') {
      plan = earlyRetirementTemplate;
    } else {
      plan = await getPlanForUserIdOrThrow(ctx, planId, userId);
    }

    const { timeline, incomes, expenses, accounts, contributionRules, baseContributionRule, marketAssumptions } = plan;
    const clonedData = {
      timeline: structuredClone(timeline),
      incomes: structuredClone(incomes),
      expenses: structuredClone(expenses),
      accounts: structuredClone(accounts),
      contributionRules: structuredClone(contributionRules),
      baseContributionRule: structuredClone(baseContributionRule),
      marketAssumptions: structuredClone(marketAssumptions),
    };

    return await ctx.db.insert('plans', { userId, name: newPlanName, ...clonedData });
  },
});

export const deletePlan = mutation({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const { userId } = await getUserIdOrThrow(ctx);
    await getPlanForUserIdOrThrow(ctx, planId, userId);

    const numPlans = await ctx.runQuery(api.plans.getCountOfPlans, {});
    if (numPlans <= 1) throw new Error('You cannot delete your only plan.');

    await ctx.db.delete(planId);
  },
});

export const updatePlanName = mutation({
  args: { planId: v.id('plans'), name: v.string() },
  handler: async (ctx, { planId, name }) => {
    const { userId } = await getUserIdOrThrow(ctx);
    await getPlanForUserIdOrThrow(ctx, planId, userId);

    await ctx.db.patch(planId, { name });
  },
});

export const updatePlan = mutation({
  args: {
    planId: v.id('plans'),
    timeline: v.union(timelineValidator, v.null()),
    incomes: v.array(incomeValidator),
    expenses: v.array(expenseValidator),
    accounts: v.array(accountValidator),
    contributionRules: v.array(contributionRulesValidator),
    baseContributionRule: baseContributionRuleValidator,
    marketAssumptions: marketAssumptionsValidator,
  },
  handler: async (ctx, { planId, timeline, incomes, expenses, accounts, contributionRules, baseContributionRule, marketAssumptions }) => {
    const { userId } = await getUserIdOrThrow(ctx);
    await getPlanForUserIdOrThrow(ctx, planId, userId);

    await ctx.db.patch(planId, {
      timeline,
      incomes,
      expenses,
      accounts,
      contributionRules,
      baseContributionRule,
      marketAssumptions,
    });
  },
});
