import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

import { timelineValidator } from './validators/timeline-validator';
import { incomeValidator } from './validators/incomes-validator';
import { expenseValidator } from './validators/expenses-validator';
import { accountValidator } from './validators/accounts-validator';
import { contributionRulesValidator, baseContributionRuleValidator } from './validators/contribution-rules-validator';
import { marketAssumptionsValidator } from './validators/market-assumptions-validator';

export default defineSchema({
  plans: defineTable({
    userId: v.id('user'),
    name: v.string(),
    timeline: v.union(timelineValidator, v.null()),
    incomes: v.array(incomeValidator),
    expenses: v.array(expenseValidator),
    accounts: v.array(accountValidator),
    contributionRules: v.array(contributionRulesValidator),
    baseContributionRule: baseContributionRuleValidator,
    marketAssumptions: marketAssumptionsValidator,
  }).index('by_userId', ['userId']),
});
