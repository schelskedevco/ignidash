import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useMemo } from 'react';

import {
  simulatorFromConvex,
  marketAssumptionsFromConvex,
  timelineFromConvex,
  incomeFromConvex,
  expenseFromConvex,
  accountFromConvex,
  contributionFromConvex,
  baseContributionFromConvex,
} from '@/lib/utils/convex-to-zod-transformers';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';

// Simulator Plan
export const usePlanData = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.plans.getPlan, { planId });
  return useMemo(() => (q ? simulatorFromConvex(q) : null), [q]);
};

// Market Assumptions
export const useMarketAssumptionsData = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.market_assumptions.get, { planId });
  return useMemo(() => (q ? marketAssumptionsFromConvex(q) : null), [q]);
};

// Timeline
export const useTimelineData = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.timeline.get, { planId });
  return useMemo(() => (q ? timelineFromConvex(q) : null), [q]);
};

// Incomes
export const useIncomesData = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.income.getIncomes, { planId });
  return useMemo(() => (q ? Object.fromEntries(q.map((income) => [income.id, incomeFromConvex(income)])) : {}), [q]);
};

export const useCountOfIncomes = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.income.getCountOfIncomes, { planId });
  return useMemo(() => (q ? q : 0), [q]);
};

export const useIncomeData = (incomeId: string | null) => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.income.getIncome, { planId, incomeId });
  return useMemo(() => (q ? incomeFromConvex(q) : null), [q]);
};

// Expenses
export const useExpensesData = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.expense.getExpenses, { planId });
  return useMemo(() => (q ? Object.fromEntries(q.map((expense) => [expense.id, expenseFromConvex(expense)])) : {}), [q]);
};

export const useCountOfExpenses = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.expense.getCountOfExpenses, { planId });
  return useMemo(() => (q ? q : 0), [q]);
};

export const useExpenseData = (expenseId: string | null) => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.expense.getExpense, { planId, expenseId });
  return useMemo(() => (q ? expenseFromConvex(q) : null), [q]);
};

// Accounts
export const useAccountsData = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.account.getAccounts, { planId });
  return useMemo(() => (q ? Object.fromEntries(q.map((account) => [account.id, accountFromConvex(account)])) : {}), [q]);
};

export const useCountOfAccounts = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.account.getCountOfAccounts, { planId });
  return useMemo(() => (q ? q : 0), [q]);
};

export const useAccountData = (accountId: string | null) => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.account.getAccount, { planId, accountId });
  return useMemo(() => (q ? accountFromConvex(q) : null), [q]);
};

export const useSavingsData = (accountId: string | null) => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.account.getSavingsAccount, { planId, accountId });
  return useMemo(() => (q ? accountFromConvex(q) : null), [q]);
};

export const useInvestmentData = (accountId: string | null) => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.account.getInvestmentAccount, { planId, accountId });
  return useMemo(() => (q ? accountFromConvex(q) : null), [q]);
};

// Contribution Rules
export const useContributionRulesData = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.contribution_rule.getContributionRules, { planId });
  return useMemo(() => (q ? Object.fromEntries(q.map((rule) => [rule.id, contributionFromConvex(rule)])) : {}), [q]);
};

export const useCountOfContributionRules = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.contribution_rule.getCountOfContributionRules, { planId });
  return useMemo(() => (q ? q : 0), [q]);
};

export const useContributionRuleData = (ruleId: string | null) => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.contribution_rule.getContributionRule, { planId, ruleId });
  return useMemo(() => (q ? contributionFromConvex(q) : null), [q]);
};

export const useBaseContributionRuleData = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.contribution_rule.getBaseRule, { planId });
  return useMemo(() => (q ? baseContributionFromConvex(q) : null), [q]);
};

// Tax Settings
export const useTaxSettingsData = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.tax_settings.get, { planId });
  return useMemo(() => (q ? q : null), [q]);
};

// Privacy Settings
export const usePrivacySettingsData = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.privacy_settings.get, { planId });
  return useMemo(() => (q ? q : null), [q]);
};

// Simulation Settings
export const useSimulationSettingsData = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.simulation_settings.get, { planId });
  return useMemo(() => (q ? q : null), [q]);
};

// Finances
export const useAssetData = () => {
  const q = useQuery(api.finances.getAssets);
  return useMemo(() => (q ? q : null), [q]);
};

export const useLiabilityData = () => {
  const q = useQuery(api.finances.getLiabilities);
  return useMemo(() => (q ? q : null), [q]);
};
