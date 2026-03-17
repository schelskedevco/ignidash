import { v } from 'convex/values';

import { timelineValidator } from './timeline_validator';
import { incomeValidator } from './incomes_validator';
import { expenseValidator } from './expenses_validator';
import { debtValidator } from './debt_validator';
import { physicalAssetValidator } from './physical_asset_validator';
import { accountValidator } from './accounts_validator';
import { glidePathValidator } from './glide_path_validator';
import { contributionRulesValidator, baseContributionRuleValidator } from './contribution_rules_validator';
import { marketAssumptionsValidator } from './market_assumptions_validator';
import { taxSettingsValidator } from './tax_settings_validator';
import { privacySettingsValidator } from './privacy_settings_validator';
import { simulationSettingsValidator } from './simulation_settings_validator';

/** Plan data fields shared between `plans` and `planSnapshots` tables. */
export const planDataFields = {
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
};
