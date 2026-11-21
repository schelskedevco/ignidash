/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as account from "../account.js";
import type * as app_data from "../app_data.js";
import type * as auth from "../auth.js";
import type * as contribution_rule from "../contribution_rule.js";
import type * as conversations from "../conversations.js";
import type * as crons from "../crons.js";
import type * as debt from "../debt.js";
import type * as expense from "../expense.js";
import type * as finances from "../finances.js";
import type * as glide_path from "../glide_path.js";
import type * as http from "../http.js";
import type * as income from "../income.js";
import type * as insights from "../insights.js";
import type * as market_assumptions from "../market_assumptions.js";
import type * as messages from "../messages.js";
import type * as migrations from "../migrations.js";
import type * as onboarding from "../onboarding.js";
import type * as physical_asset from "../physical_asset.js";
import type * as plan_snapshots from "../plan_snapshots.js";
import type * as plans from "../plans.js";
import type * as posthog from "../posthog.js";
import type * as privacy_settings from "../privacy_settings.js";
import type * as simulation_settings from "../simulation_settings.js";
import type * as tax_settings from "../tax_settings.js";
import type * as templates_basic from "../templates/basic.js";
import type * as templates_early_retirement from "../templates/early_retirement.js";
import type * as timeline from "../timeline.js";
import type * as use_openai from "../use_openai.js";
import type * as user_feedback from "../user_feedback.js";
import type * as utils_ai_utils from "../utils/ai_utils.js";
import type * as utils_auth_utils from "../utils/auth_utils.js";
import type * as utils_conversation_utils from "../utils/conversation_utils.js";
import type * as utils_finance_sync_utils from "../utils/finance_sync_utils.js";
import type * as utils_finances_utils from "../utils/finances_utils.js";
import type * as utils_insights_utils from "../utils/insights_utils.js";
import type * as utils_plan_export_utils from "../utils/plan_export_utils.js";
import type * as utils_plan_utils from "../utils/plan_utils.js";
import type * as utils_snapshot_utils from "../utils/snapshot_utils.js";
import type * as utils_sys_prompt_utils from "../utils/sys_prompt_utils.js";
import type * as validators_accounts_validator from "../validators/accounts_validator.js";
import type * as validators_asset_validator from "../validators/asset_validator.js";
import type * as validators_contribution_rules_validator from "../validators/contribution_rules_validator.js";
import type * as validators_debt_validator from "../validators/debt_validator.js";
import type * as validators_expenses_validator from "../validators/expenses_validator.js";
import type * as validators_glide_path_validator from "../validators/glide_path_validator.js";
import type * as validators_incomes_validator from "../validators/incomes_validator.js";
import type * as validators_key_metrics_validator from "../validators/key_metrics_validator.js";
import type * as validators_liability_validator from "../validators/liability_validator.js";
import type * as validators_market_assumptions_validator from "../validators/market_assumptions_validator.js";
import type * as validators_physical_asset_validator from "../validators/physical_asset_validator.js";
import type * as validators_plan_data_fields from "../validators/plan_data_fields.js";
import type * as validators_privacy_settings_validator from "../validators/privacy_settings_validator.js";
import type * as validators_simulation_result_validator from "../validators/simulation_result_validator.js";
import type * as validators_simulation_settings_validator from "../validators/simulation_settings_validator.js";
import type * as validators_tax_settings_validator from "../validators/tax_settings_validator.js";
import type * as validators_timeline_validator from "../validators/timeline_validator.js";
import type * as validators_user_feedback_validator from "../validators/user_feedback_validator.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  account: typeof account;
  app_data: typeof app_data;
  auth: typeof auth;
  contribution_rule: typeof contribution_rule;
  conversations: typeof conversations;
  crons: typeof crons;
  debt: typeof debt;
  expense: typeof expense;
  finances: typeof finances;
  glide_path: typeof glide_path;
  http: typeof http;
  income: typeof income;
  insights: typeof insights;
  market_assumptions: typeof market_assumptions;
  messages: typeof messages;
  migrations: typeof migrations;
  onboarding: typeof onboarding;
  physical_asset: typeof physical_asset;
  plan_snapshots: typeof plan_snapshots;
  plans: typeof plans;
  posthog: typeof posthog;
  privacy_settings: typeof privacy_settings;
  simulation_settings: typeof simulation_settings;
  tax_settings: typeof tax_settings;
  "templates/basic": typeof templates_basic;
  "templates/early_retirement": typeof templates_early_retirement;
  timeline: typeof timeline;
  use_openai: typeof use_openai;
  user_feedback: typeof user_feedback;
  "utils/ai_utils": typeof utils_ai_utils;
  "utils/auth_utils": typeof utils_auth_utils;
  "utils/conversation_utils": typeof utils_conversation_utils;
  "utils/finance_sync_utils": typeof utils_finance_sync_utils;
  "utils/finances_utils": typeof utils_finances_utils;
  "utils/insights_utils": typeof utils_insights_utils;
  "utils/plan_export_utils": typeof utils_plan_export_utils;
  "utils/plan_utils": typeof utils_plan_utils;
  "utils/snapshot_utils": typeof utils_snapshot_utils;
  "utils/sys_prompt_utils": typeof utils_sys_prompt_utils;
  "validators/accounts_validator": typeof validators_accounts_validator;
  "validators/asset_validator": typeof validators_asset_validator;
  "validators/contribution_rules_validator": typeof validators_contribution_rules_validator;
  "validators/debt_validator": typeof validators_debt_validator;
  "validators/expenses_validator": typeof validators_expenses_validator;
  "validators/glide_path_validator": typeof validators_glide_path_validator;
  "validators/incomes_validator": typeof validators_incomes_validator;
  "validators/key_metrics_validator": typeof validators_key_metrics_validator;
  "validators/liability_validator": typeof validators_liability_validator;
  "validators/market_assumptions_validator": typeof validators_market_assumptions_validator;
  "validators/physical_asset_validator": typeof validators_physical_asset_validator;
  "validators/plan_data_fields": typeof validators_plan_data_fields;
  "validators/privacy_settings_validator": typeof validators_privacy_settings_validator;
  "validators/simulation_result_validator": typeof validators_simulation_result_validator;
  "validators/simulation_settings_validator": typeof validators_simulation_settings_validator;
  "validators/tax_settings_validator": typeof validators_tax_settings_validator;
  "validators/timeline_validator": typeof validators_timeline_validator;
  "validators/user_feedback_validator": typeof validators_user_feedback_validator;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
};
