import { v, ConvexError } from 'convex/values';
import { query, mutation, internalMutation } from './_generated/server';
import type { Doc } from './_generated/dataModel';

import { getUserIdOrThrow } from './utils/auth_utils';
import { deleteAllConversationsForPlan } from './utils/conversation_utils';
import { deleteAllInsightsForPlan } from './utils/insights_utils';
import { getPlanForCurrentUserOrThrow, getAllPlansForUser } from './utils/plan_utils';
import { timelineValidator } from './validators/timeline_validator';
import { incomeValidator } from './validators/incomes_validator';
import { expenseValidator } from './validators/expenses_validator';
import { debtValidator } from './validators/debt_validator';
import { physicalAssetValidator } from './validators/physical_asset_validator';
import { accountValidator } from './validators/accounts_validator';
import { glidePathValidator } from './validators/glide_path_validator';
import { contributionRulesValidator, baseContributionRuleValidator } from './validators/contribution_rules_validator';
import { marketAssumptionsValidator } from './validators/market_assumptions_validator';
import { taxSettingsValidator } from './validators/tax_settings_validator';
import { privacySettingsValidator } from './validators/privacy_settings_validator';
import { simulationSettingsValidator } from './validators/simulation_settings_validator';
import { basicTemplate } from './templates/basic';
import { earlyRetirementTemplate } from './templates/early_retirement';

export const listPlans = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await getUserIdOrThrow(ctx);

    return await getAllPlansForUser(ctx, userId);
  },
});

export const getCountOfPlans = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const plans = await getAllPlansForUser(ctx, userId);

    return plans.length;
  },
});

export const getPlan = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    return await getPlanForCurrentUserOrThrow(ctx, planId);
  },
});

export const getPlanName = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    return plan.name;
  },
});

export const getDefaultPlanId = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const plans = await getAllPlansForUser(ctx, userId);

    return plans.find((plan) => plan.isDefault)?._id ?? null;
  },
});

export const getOrCreateDefaultPlan = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId, userName } = await getUserIdOrThrow(ctx);

    const plans = await getAllPlansForUser(ctx, userId);
    const defaultPlan = plans.find((plan) => plan.isDefault);
    if (defaultPlan) return defaultPlan._id;

    return await ctx.db.insert('plans', {
      userId,
      name: `${userName}'s Plan`,
      isDefault: true,
      timeline: null,
      incomes: [],
      expenses: [],
      debts: [],
      physicalAssets: [],
      accounts: [],
      contributionRules: [],
      baseContributionRule: { type: 'save' },
      marketAssumptions: { stockReturn: 10, stockYield: 3.5, bondReturn: 5, bondYield: 4.5, cashReturn: 3, inflationRate: 3 },
      taxSettings: { filingStatus: 'single' },
      privacySettings: { isPrivate: true },
      simulationSettings: { simulationSeed: 9521, simulationMode: 'fixedReturns' },
    });
  },
});

export const internalGetOrCreateDefaultPlan = internalMutation({
  args: {
    userId: v.string(),
    userName: v.string(),
  },
  handler: async (ctx, { userId, userName }) => {
    const plans = await getAllPlansForUser(ctx, userId);
    const defaultPlan = plans.find((plan) => plan.isDefault);
    if (defaultPlan) return defaultPlan._id;

    return await ctx.db.insert('plans', {
      userId,
      name: `${userName}'s Plan`,
      isDefault: true,
      timeline: null,
      incomes: [],
      expenses: [],
      debts: [],
      physicalAssets: [],
      accounts: [],
      contributionRules: [],
      baseContributionRule: { type: 'save' },
      marketAssumptions: { stockReturn: 10, stockYield: 3.5, bondReturn: 5, bondYield: 4.5, cashReturn: 3, inflationRate: 3 },
      taxSettings: { filingStatus: 'single' },
      privacySettings: { isPrivate: true },
      simulationSettings: { simulationSeed: 9521, simulationMode: 'fixedReturns' },
    });
  },
});

export const createBlankPlan = mutation({
  args: { newPlanName: v.string() },
  handler: async (ctx, { newPlanName }) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const plans = await getAllPlansForUser(ctx, userId);
    if (plans.length >= 10) throw new ConvexError('Maximum of 10 plans reached');

    return await ctx.db.insert('plans', {
      userId,
      name: newPlanName,
      isDefault: false,
      timeline: null,
      incomes: [],
      expenses: [],
      debts: [],
      physicalAssets: [],
      accounts: [],
      contributionRules: [],
      baseContributionRule: { type: 'save' },
      marketAssumptions: { stockReturn: 10, stockYield: 3.5, bondReturn: 5, bondYield: 4.5, cashReturn: 3, inflationRate: 3 },
      taxSettings: { filingStatus: 'single' },
      privacySettings: { isPrivate: true },
      simulationSettings: { simulationSeed: 9521, simulationMode: 'fixedReturns' },
    });
  },
});

export const createPlanWithData = mutation({
  args: {
    newPlanName: v.string(),
    isDefault: v.boolean(),
    timeline: v.union(timelineValidator, v.null()),
    incomes: v.array(incomeValidator),
    expenses: v.array(expenseValidator),
    debts: v.optional(v.array(debtValidator)),
    physicalAssets: v.optional(v.array(physicalAssetValidator)),
    accounts: v.array(accountValidator),
    glidePath: v.optional(glidePathValidator),
    contributionRules: v.array(contributionRulesValidator),
    baseContributionRule: baseContributionRuleValidator,
    marketAssumptions: marketAssumptionsValidator,
    taxSettings: taxSettingsValidator,
    privacySettings: privacySettingsValidator,
    simulationSettings: simulationSettingsValidator,
  },
  handler: async (
    ctx,
    {
      newPlanName,
      isDefault,
      timeline,
      incomes,
      expenses,
      debts,
      physicalAssets,
      accounts,
      glidePath,
      contributionRules,
      baseContributionRule,
      marketAssumptions,
      taxSettings,
      privacySettings,
      simulationSettings,
    }
  ) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const plans = await getAllPlansForUser(ctx, userId);
    if (plans.length >= 10) throw new ConvexError('Maximum of 10 plans reached');

    return await ctx.db.insert('plans', {
      userId,
      name: newPlanName,
      isDefault,
      timeline,
      incomes,
      expenses,
      debts,
      physicalAssets,
      accounts,
      glidePath,
      contributionRules,
      baseContributionRule,
      marketAssumptions,
      taxSettings,
      privacySettings,
      simulationSettings,
    });
  },
});

export const clonePlan = mutation({
  args: { newPlanName: v.string(), planId: v.union(v.id('plans'), v.literal('template1'), v.literal('template2')) },
  handler: async (ctx, { newPlanName, planId }) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const plans = await getAllPlansForUser(ctx, userId);
    if (plans.length >= 10) throw new ConvexError('Maximum of 10 plans reached');

    let plan: Omit<Doc<'plans'>, '_id' | '_creationTime' | 'userId' | 'name'>;
    if (planId === 'template1') {
      plan = basicTemplate;
    } else if (planId === 'template2') {
      plan = earlyRetirementTemplate;
    } else {
      plan = await getPlanForCurrentUserOrThrow(ctx, planId);
    }

    const {
      timeline,
      incomes,
      expenses,
      debts,
      physicalAssets,
      accounts,
      contributionRules,
      baseContributionRule,
      marketAssumptions,
      taxSettings,
      privacySettings,
      simulationSettings,
    } = plan;
    const clonedData = {
      timeline: structuredClone(timeline),
      incomes: structuredClone(incomes),
      expenses: structuredClone(expenses),
      debts: structuredClone(debts),
      physicalAssets: structuredClone(physicalAssets),
      accounts: structuredClone(accounts),
      contributionRules: structuredClone(contributionRules),
      baseContributionRule: structuredClone(baseContributionRule),
      marketAssumptions: structuredClone(marketAssumptions),
      taxSettings: structuredClone(taxSettings),
      privacySettings: structuredClone(privacySettings),
      simulationSettings: structuredClone(simulationSettings),
    };

    return await ctx.db.insert('plans', { userId, name: newPlanName, isDefault: false, ...clonedData });
  },
});

export const deletePlan = mutation({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const { userId } = await getUserIdOrThrow(ctx);
    await getPlanForCurrentUserOrThrow(ctx, planId);

    const plans = await getAllPlansForUser(ctx, userId);
    if (plans.length <= 1) throw new ConvexError('You cannot delete your only plan.');

    const planToDelete = plans.find((plan) => plan._id === planId);
    if (planToDelete?.isDefault) throw new ConvexError('You cannot delete your default plan.');

    await Promise.all([deleteAllConversationsForPlan(ctx, planId), deleteAllInsightsForPlan(ctx, planId)]);

    await ctx.db.delete(planId);
  },
});

export const updatePlanName = mutation({
  args: { planId: v.id('plans'), name: v.string() },
  handler: async (ctx, { planId, name }) => {
    await getPlanForCurrentUserOrThrow(ctx, planId);

    await ctx.db.patch(planId, { name });
  },
});

export const setPlanAsDefault = mutation({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const { userId } = await getUserIdOrThrow(ctx);
    const planToSetAsDefault = await getPlanForCurrentUserOrThrow(ctx, planId);

    if (planToSetAsDefault.isDefault) return;

    const plans = await getAllPlansForUser(ctx, userId);
    await Promise.all(plans.filter((plan) => plan.isDefault).map((plan) => ctx.db.patch(plan._id, { isDefault: false })));

    await ctx.db.patch(planId, { isDefault: true });
  },
});
