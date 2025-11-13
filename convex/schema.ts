import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

import { timelineValidator } from './validators/timeline_validator';
import { incomeValidator } from './validators/incomes_validator';
import { expenseValidator } from './validators/expenses_validator';
import { accountValidator } from './validators/accounts_validator';
import { contributionRulesValidator, baseContributionRuleValidator } from './validators/contribution_rules_validator';
import { marketAssumptionsValidator } from './validators/market_assumptions_validator';
import { taxSettingsValidator } from './validators/tax_settings_validator';

export default defineSchema({
  plans: defineTable({
    userId: v.string(),
    name: v.string(),
    timeline: v.union(timelineValidator, v.null()),
    incomes: v.array(incomeValidator),
    expenses: v.array(expenseValidator),
    accounts: v.array(accountValidator),
    contributionRules: v.array(contributionRulesValidator),
    baseContributionRule: baseContributionRuleValidator,
    marketAssumptions: marketAssumptionsValidator,
    taxSettings: taxSettingsValidator,
  }).index('by_userId', ['userId']),
});
