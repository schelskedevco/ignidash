import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useMemo } from 'react';

import {
  simulatorFromConvex,
  marketAssumptionsFromConvex,
  timelineFromConvex,
  incomeFromConvex,
  expenseFromConvex,
  debtFromConvex,
  physicalAssetFromConvex,
  accountFromConvex,
  contributionFromConvex,
  baseContributionFromConvex,
  glidePathFromConvex,
} from '@/lib/utils/convex-to-zod-transformers';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';

// Plan Name
export const usePlanName = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.plans.getPlanName, { planId });
  return { name: q ?? null, isLoading: q === undefined };
};

// Simulator Plan
export const usePlanData = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.plans.getPlan, { planId });
  return { data: useMemo(() => (q ? simulatorFromConvex(q) : null), [q]), isLoading: q === undefined };
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
  return {
    data: useMemo(() => (q ? Object.fromEntries(q.map((income) => [income.id, incomeFromConvex(income)])) : {}), [q]),
    isLoading: q === undefined,
  };
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
  return {
    data: useMemo(() => (q ? Object.fromEntries(q.map((expense) => [expense.id, expenseFromConvex(expense)])) : {}), [q]),
    isLoading: q === undefined,
  };
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

// Debts
export const useDebtsData = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.debt.getDebts, { planId });
  return {
    data: useMemo(() => (q ? Object.fromEntries(q.map((debt) => [debt.id, debtFromConvex(debt)])) : {}), [q]),
    isLoading: q === undefined,
  };
};

export const useCountOfDebts = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.debt.getCountOfDebts, { planId });
  return useMemo(() => (q ? q : 0), [q]);
};

export const useDebtData = (debtId: string | null) => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.debt.getDebt, { planId, debtId });
  return useMemo(() => (q ? debtFromConvex(q) : null), [q]);
};

// Physical Assets
export const usePhysicalAssetsData = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.physical_asset.getPhysicalAssets, { planId });
  return {
    data: useMemo(() => (q ? Object.fromEntries(q.map((asset) => [asset.id, physicalAssetFromConvex(asset)])) : {}), [q]),
    isLoading: q === undefined,
  };
};

export const useCountOfPhysicalAssets = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.physical_asset.getCountOfPhysicalAssets, { planId });
  return useMemo(() => (q ? q : 0), [q]);
};

export const usePhysicalAssetData = (physicalAssetId: string | null) => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.physical_asset.getPhysicalAsset, { planId, physicalAssetId });
  return useMemo(() => (q ? physicalAssetFromConvex(q) : null), [q]);
};

// Accounts
export const useAccountsData = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.account.getAccounts, { planId });
  return {
    data: useMemo(() => (q ? Object.fromEntries(q.map((account) => [account.id, accountFromConvex(account)])) : {}), [q]),
    isLoading: q === undefined,
  };
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

// Glide Path
export const useGlidePathData = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.glide_path.get, { planId });
  return {
    data: useMemo(() => (q ? glidePathFromConvex(q) : undefined), [q]),
    isLoading: q === undefined,
  };
};

// Contribution Rules
export const useContributionRulesData = () => {
  const planId = useSelectedPlanId();
  const q = useQuery(api.contribution_rule.getContributionRules, { planId });
  return {
    data: useMemo(() => (q ? Object.fromEntries(q.map((rule) => [rule.id, contributionFromConvex(rule)])) : {}), [q]),
    isLoading: q === undefined,
  };
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
