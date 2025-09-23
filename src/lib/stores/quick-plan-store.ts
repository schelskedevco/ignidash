import { useMemo } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import useSWR from 'swr';
import { v4 as uuidv4 } from 'uuid';

import type { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';
import { FinancialSimulationEngine, type SimulationResult } from '@/lib/calc/v2/simulation-engine';
import { FixedReturnsProvider } from '@/lib/calc/returns-providers/fixed-returns-provider';
import { StochasticReturnsProvider } from '@/lib/calc/returns-providers/stochastic-returns-provider';
import { LcgHistoricalBacktestReturnsProvider } from '@/lib/calc/returns-providers/lcg-historical-backtest-returns-provider';
import { TableDataExtractor } from '@/lib/calc/v2/table-data-extractor';
import { getSimulationWorker } from '@/lib/workers/simulation-worker-api';
import type { SingleSimulationTableRow } from '@/lib/schemas/single-simulation-table-schema';
import type { IncomeInputs } from '@/lib/schemas/income-form-schema';
import type { AccountInputs } from '@/lib/schemas/account-form-schema';
import type { ExpenseInputs } from '@/lib/schemas/expense-form-schema';
import type { TimelineInputs } from '@/lib/schemas/timeline-form-schema';
import type { ContributionInputs, BaseContributionInputs } from '@/lib/schemas/contribution-form-schema';
import type { MarketAssumptionsInputs } from '../schemas/market-assumptions-schema';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import type {
  SingleSimulationPortfolioChartDataPoint,
  SingleSimulationCashFlowChartDataPoint,
  SingleSimulationTaxesChartDataPoint,
  SingleSimulationReturnsChartDataPoint,
  SingleSimulationContributionsChartDataPoint,
  SingleSimulationWithdrawalsChartDataPoint,
} from '@/lib/types/chart-data-points';
import { SimulationCategory } from '@/lib/types/simulation-category';

// ================================
// STATE INTERFACE & DEFAULT STATE
// ================================

interface QuickPlanState {
  inputs: QuickPlanInputs;

  preferences: {
    dataStorage: 'localStorage' | 'none';
    showReferenceLines: boolean;
    simulationSeed: number;
    sidebarCollapsed: boolean;
    simulationMode:
      | 'fixedReturns'
      | 'stochasticReturns'
      | 'historicalReturns'
      | 'monteCarloStochasticReturns'
      | 'monteCarloHistoricalReturns';
  };

  actions: {
    /* Expected Returns */
    updateMarketAssumptions: (data: MarketAssumptionsInputs) => void;

    /* Timeline */
    updateTimeline: (data: TimelineInputs) => void;

    /* Cash Flows */
    updateIncomes: (data: IncomeInputs) => void;
    deleteIncome: (id: string) => void;

    updateExpenses: (data: ExpenseInputs) => void;
    deleteExpense: (id: string) => void;

    /* Portfolio */
    updateAccounts: (data: AccountInputs) => void;
    deleteAccount: (id: string) => void;

    /* Contribution Order */
    updateContributionRules: (data: ContributionInputs) => void;
    reorderContributionRules: (newOrder: string[]) => void;
    deleteContributionRule: (id: string) => void;
    updateBaseContributionRule: (data: BaseContributionInputs) => void;

    /* Preferences */
    updateDataStoragePreference: (value: QuickPlanState['preferences']['dataStorage']) => void;
    updateShowReferenceLines: (value: boolean) => void;
    updateSimulationSeed: () => void;
    updateSidebarCollapsed: (value: boolean) => void;
    updateSimulationMode: (value: QuickPlanState['preferences']['simulationMode']) => void;

    resetStore: () => void;
  };
}

export const defaultState: Omit<QuickPlanState, 'actions'> = {
  inputs: {
    timeline: undefined,
    incomes: {},
    expenses: {},
    accounts: {},
    contributionRules: {},
    baseContributionRule: { type: 'save' },
    marketAssumptions: { stockReturn: 10, bondReturn: 5, cashReturn: 3, inflationRate: 3 },
  },
  preferences: {
    dataStorage: 'localStorage',
    showReferenceLines: true,
    simulationSeed: Math.floor(Math.random() * 1000),
    sidebarCollapsed: false,
    simulationMode: 'fixedReturns',
  },
};

// ================================
// PERSISTENCE UTILITIES
// ================================

/**
 * Clean up existing data if dataStorage preference is "none"
 * Removes sensitive user data from localStorage while preserving preferences
 */
const cleanupExistingData = () => {
  if (typeof window === 'undefined') return;

  const stored = localStorage.getItem('quick-plan-storage');
  if (!stored) return;

  try {
    const parsed = JSON.parse(stored);
    if (parsed.state?.preferences?.dataStorage === 'none') {
      // Only keep preferences, remove inputs
      const cleanedData = {
        state: {
          preferences: parsed.state.preferences,
        },
        version: parsed.version,
      };
      localStorage.setItem('quick-plan-storage', JSON.stringify(cleanedData));
    }
  } catch (error) {
    // Handle parsing errors - remove corrupted data
    console.warn('Failed to parse quick-plan storage:', error);
    localStorage.removeItem('quick-plan-storage');
  }
};

cleanupExistingData();

// ================================
// STORE CREATION
// ================================

export const useQuickPlanStore = create<QuickPlanState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...defaultState,
        actions: {
          updateMarketAssumptions: (data) =>
            set((state) => {
              state.inputs.marketAssumptions = { ...data };
            }),
          updateTimeline: (data) =>
            set((state) => {
              state.inputs.timeline = { ...data };
            }),
          updateIncomes: (data) =>
            set((state) => {
              state.inputs.incomes = { ...state.inputs.incomes, [data.id]: data };
            }),
          deleteIncome: (id) =>
            set((state) => {
              Object.values(state.inputs.contributionRules).forEach((rule) => {
                if (rule.incomeIds?.includes(id)) rule.incomeIds = rule.incomeIds.filter((incomeId) => incomeId !== id);
              });

              delete state.inputs.incomes[id];
            }),
          updateAccounts: (data) =>
            set((state) => {
              if (!(data.id in get().inputs.accounts)) {
                const contributionRulesCount = Object.keys(get().inputs.contributionRules).length;

                const contributionRuleId = uuidv4();
                const contributionRuleData: ContributionInputs = {
                  id: contributionRuleId,
                  accountId: data.id,
                  rank: contributionRulesCount + 1,
                  contributionType: 'unlimited',
                };

                state.inputs.contributionRules = { ...state.inputs.contributionRules, [contributionRuleId]: contributionRuleData };
              }

              state.inputs.accounts = { ...state.inputs.accounts, [data.id]: data };
            }),
          deleteAccount: (id) =>
            set((state) => {
              const contributionRules = Object.values(state.inputs.contributionRules);
              const contributionRulesToDelete = contributionRules.filter((rule) => rule.accountId === id);

              if (contributionRulesToDelete.length > 0) {
                contributionRulesToDelete.sort((a, b) => a.rank - b.rank);

                contributionRulesToDelete.forEach((ruleToDelete) => {
                  delete state.inputs.contributionRules[ruleToDelete.id];

                  const deletedRank = ruleToDelete.rank;
                  Object.values(state.inputs.contributionRules).forEach((rule) => {
                    if (rule.rank > deletedRank) rule.rank--;
                  });
                });
              }

              delete state.inputs.accounts[id];
            }),
          updateExpenses: (data) =>
            set((state) => {
              state.inputs.expenses = { ...state.inputs.expenses, [data.id]: data };
            }),
          deleteExpense: (id) =>
            set((state) => {
              delete state.inputs.expenses[id];
            }),
          updateContributionRules: (data) =>
            set((state) => {
              state.inputs.contributionRules = { ...state.inputs.contributionRules, [data.id]: data };
            }),
          reorderContributionRules: (newOrder) => {
            set((state) => {
              newOrder.forEach((id, index) => {
                const contributionRule = state.inputs.contributionRules[id];
                if (contributionRule) {
                  contributionRule.rank = index + 1;
                }
              });
            });
          },
          deleteContributionRule: (id) =>
            set((state) => {
              delete state.inputs.contributionRules[id];
            }),
          updateBaseContributionRule: (data) =>
            set((state) => {
              state.inputs.baseContributionRule = { ...data };
            }),
          updateDataStoragePreference: (value) =>
            set((state) => {
              state.preferences.dataStorage = value as 'localStorage' | 'none';
            }),
          updateShowReferenceLines: (value) =>
            set((state) => {
              state.preferences.showReferenceLines = value;
            }),
          updateSimulationSeed: () =>
            set((state) => {
              state.preferences.simulationSeed = Math.floor(Math.random() * 1000);
            }),
          updateSidebarCollapsed: (value) =>
            set((state) => {
              state.preferences.sidebarCollapsed = value;
            }),
          updateSimulationMode: (value) =>
            set((state) => {
              state.preferences.simulationMode = value;
            }),
          resetStore: () =>
            set((state) => {
              state.inputs = { ...defaultState.inputs };
            }),
        },
      })),
      {
        name: 'quick-plan-storage',
        version: 1,
        migrate: () => ({ ...defaultState }),
        partialize: (state) => {
          const baseResult = { preferences: state.preferences };

          if (state.preferences.dataStorage === 'localStorage') {
            return {
              ...baseResult,
              inputs: state.inputs,
            };
          }

          return baseResult;
        },
      }
    ),
    {
      name: 'Quick Plan Store',
      anonymousActionType: 'quickPlan/action',
    }
  )
);

// ================================
// DATA SELECTORS
// ================================

/**
 * Data selectors (stable references)
 * These hooks provide direct access to specific sections of the form data
 */
export const useMarketAssumptionsData = () => useQuickPlanStore((state) => state.inputs.marketAssumptions);

export const useTimelineData = () => useQuickPlanStore((state) => state.inputs.timeline);

export const useIncomesData = () => useQuickPlanStore((state) => state.inputs.incomes);
export const useIncomeData = (id: string | null) => useQuickPlanStore((state) => (id !== null ? state.inputs.incomes[id] : null));

export const useExpensesData = () => useQuickPlanStore((state) => state.inputs.expenses);
export const useExpenseData = (id: string | null) => useQuickPlanStore((state) => (id !== null ? state.inputs.expenses[id] : null));

export const useAccountsData = () => useQuickPlanStore((state) => state.inputs.accounts);
export const useAccountData = (id: string | null) => useQuickPlanStore((state) => (id !== null ? state.inputs.accounts[id] : null));

export const useSavingsData = (id: string | null) =>
  useQuickPlanStore((state) => {
    if (id === null) return null;

    const account = state.inputs.accounts[id];
    return account?.type === 'savings' ? account : null;
  });
export const useInvestmentData = (id: string | null) =>
  useQuickPlanStore((state) => {
    if (id === null) return null;

    const account = state.inputs.accounts[id];
    return account?.type !== 'savings' ? account : null;
  });

export const useContributionRulesData = () => useQuickPlanStore((state) => state.inputs.contributionRules);
export const useContributionRuleData = (id: string | null) =>
  useQuickPlanStore((state) => (id !== null ? state.inputs.contributionRules[id] : null));

export const useBaseContributionRuleData = () => useQuickPlanStore((state) => state.inputs.baseContributionRule);

/**
 * Action selectors
 * These hooks provide access to update functions with built-in validation
 */
export const useUpdateMarketAssumptions = () => useQuickPlanStore((state) => state.actions.updateMarketAssumptions);
export const useUpdateTimeline = () => useQuickPlanStore((state) => state.actions.updateTimeline);
export const useUpdateIncomes = () => useQuickPlanStore((state) => state.actions.updateIncomes);
export const useDeleteIncome = () => useQuickPlanStore((state) => state.actions.deleteIncome);
export const useUpdateExpenses = () => useQuickPlanStore((state) => state.actions.updateExpenses);
export const useDeleteExpense = () => useQuickPlanStore((state) => state.actions.deleteExpense);
export const useUpdateAccounts = () => useQuickPlanStore((state) => state.actions.updateAccounts);
export const useDeleteAccount = () => useQuickPlanStore((state) => state.actions.deleteAccount);
export const useUpdateContributionRules = () => useQuickPlanStore((state) => state.actions.updateContributionRules);
export const useReorderContributionRules = () => useQuickPlanStore((state) => state.actions.reorderContributionRules);
export const useDeleteContributionRule = () => useQuickPlanStore((state) => state.actions.deleteContributionRule);
export const useUpdateBaseContributionRule = () => useQuickPlanStore((state) => state.actions.updateBaseContributionRule);

export const useUpdateDataStoragePreference = () => useQuickPlanStore((state) => state.actions.updateDataStoragePreference);
export const useUpdateShowReferenceLines = () => useQuickPlanStore((state) => state.actions.updateShowReferenceLines);
export const useUpdateSimulationSeed = () => useQuickPlanStore((state) => state.actions.updateSimulationSeed);
export const useUpdateSidebarCollapsed = () => useQuickPlanStore((state) => state.actions.updateSidebarCollapsed);
export const useUpdateSimulationMode = () => useQuickPlanStore((state) => state.actions.updateSimulationMode);

/**
 * Preferences selectors
 * These hooks manage user preferences and settings
 */
export const useDataStoragePreference = () => useQuickPlanStore((state) => state.preferences.dataStorage);
export const useShowReferenceLines = () => useQuickPlanStore((state) => state.preferences.showReferenceLines);
export const useSimulationSeed = () => useQuickPlanStore((state) => state.preferences.simulationSeed);
export const useSidebarCollapsed = () => useQuickPlanStore((state) => state.preferences.sidebarCollapsed);
export const useSimulationMode = () => useQuickPlanStore((state) => state.preferences.simulationMode);

/**
 * Utility selectors
 * These hooks provide access to store management functions
 */
export const useResetStore = () => useQuickPlanStore((state) => state.actions.resetStore);

/**
 * Simulation & Analysis Hooks
 * These hooks provide access to simulation and analysis functions
 */
export const useSimulationResult = (
  simulationMode: 'fixedReturns' | 'stochasticReturns' | 'historicalReturns',
  seedOverride?: number | null
): SimulationResult | null => {
  const inputs = useQuickPlanStore((state) => state.inputs);
  const preferencesSeed = useSimulationSeed();
  const seed = seedOverride !== undefined && seedOverride !== null ? seedOverride : preferencesSeed;

  return useMemo(() => {
    const timeline = inputs.timeline;
    if (!timeline) return null;

    const engine = new FinancialSimulationEngine(inputs);
    switch (simulationMode) {
      case 'fixedReturns': {
        const returnsProvider = new FixedReturnsProvider(inputs);
        return engine.runSimulation(returnsProvider, timeline);
      }
      case 'stochasticReturns': {
        const returnsProvider = new StochasticReturnsProvider(inputs, seed);
        return engine.runSimulation(returnsProvider, timeline);
      }
      case 'historicalReturns': {
        const returnsProvider = new LcgHistoricalBacktestReturnsProvider(seed);
        const res = engine.runSimulation(returnsProvider, timeline);
        const _historicalRanges = returnsProvider.getHistoricalRanges();
        return res;
      }
    }
  }, [inputs, seed, simulationMode]);
};

export const useMultiSimulationResult = (simulationMode: 'monteCarloStochasticReturns' | 'monteCarloHistoricalReturns') => {
  const inputs = useQuickPlanStore((state) => state.inputs);
  const simulationSeed = useSimulationSeed();

  return useSWR(
    [inputs, simulationSeed, simulationMode],
    async () => await getSimulationWorker().analyzeMonteCarloSimulation(inputs, simulationSeed, 1000, simulationMode),
    { revalidateOnFocus: false }
  );
};

export const useKeyMetrics = (simulationResult: SimulationResult | null | undefined): KeyMetrics | null => {
  return useMemo(() => {
    if (!simulationResult) return null;
    const { data, context } = simulationResult;

    const startAge = context.startAge;
    const retirementStrategy = context.retirementStrategy;

    const initialPortfolio = data[0].portfolio.totalValue;
    const finalPortfolio = data[data.length - 1].portfolio.totalValue;

    let yearsToRetirement: number | null = null;
    let retirementAge: number | null = null;
    let portfolioAtRetirement: number | null = null;
    let progressToRetirement: number | null = null;

    switch (retirementStrategy.type) {
      case 'fixedAge':
        retirementAge = retirementStrategy.retirementAge;
        yearsToRetirement = retirementAge - startAge;

        progressToRetirement = Math.min(startAge / retirementAge, 1);

        for (const dp of data) {
          const phase = dp.phase;
          if (phase?.name === 'retirement') {
            portfolioAtRetirement = dp.portfolio.totalValue;
            break;
          }
        }

        break;
      case 'swrTarget':
        for (const dp of data) {
          const phase = dp.phase;
          if (phase?.name === 'retirement') {
            const retirementDate = new Date(dp.date);

            yearsToRetirement = retirementDate.getFullYear() - new Date().getFullYear();
            retirementAge = startAge + yearsToRetirement;
            portfolioAtRetirement = dp.portfolio.totalValue;
            break;
          }
        }

        if (portfolioAtRetirement !== null) {
          progressToRetirement = Math.min(initialPortfolio / portfolioAtRetirement, 1);
        }
        break;
    }

    const success = Number(retirementAge !== null && finalPortfolio > 0.1);

    return {
      success,
      startAge,
      retirementAge,
      yearsToRetirement,
      portfolioAtRetirement,
      finalPortfolio,
      progressToRetirement,
    };
  }, [simulationResult]);
};

/**
 * Single Simulation Chart Hooks
 * These hooks provide access to single simulation chart data
 */
export const useSingleSimulationPortfolioChartData = (simulation: SimulationResult): SingleSimulationPortfolioChartDataPoint[] => {
  return useMemo(() => {
    return simulation.data.map((data) => {
      const startAge = simulation.context.startAge;
      const startDateYear = new Date().getFullYear();
      const currDateYear = new Date(data.date).getFullYear();

      const portfolioData = data.portfolio;
      const totalValue = portfolioData.totalValue;

      const assetAllocation = portfolioData.assetAllocation ?? { stocks: 0, bonds: 0, cash: 0 };
      const stocksAllocation = assetAllocation.stocks;
      const bondsAllocation = assetAllocation.bonds;
      const cashAllocation = assetAllocation.cash;

      let cashSavings = 0;
      let taxable = 0;
      let taxDeferred = 0;
      let taxFree = 0;

      for (const account of Object.values(portfolioData.perAccountData)) {
        switch (account.type) {
          case 'savings':
            cashSavings += account.totalValue;
            break;
          case 'taxableBrokerage':
            taxable += account.totalValue;
            break;
          case '401k':
          case 'ira':
          case 'hsa':
            taxDeferred += account.totalValue;
            break;
          case 'roth401k':
          case 'rothIra':
            taxFree += account.totalValue;
            break;
        }
      }

      return {
        age: currDateYear - startDateYear + startAge,
        stocks: totalValue * stocksAllocation,
        bonds: totalValue * bondsAllocation,
        cash: totalValue * cashAllocation,
        taxable,
        taxDeferred,
        taxFree,
        cashSavings,
        perAccountData: Object.values(portfolioData.perAccountData),
      };
    });
  }, [simulation]);
};

export const useSingleSimulationCashFlowChartData = (simulation: SimulationResult): SingleSimulationCashFlowChartDataPoint[] => {
  return useMemo(() => {
    return simulation.data.slice(1).map((data) => {
      const startAge = simulation.context.startAge;
      const startDateYear = new Date().getFullYear();
      const currDateYear = new Date(data.date).getFullYear();

      const incomesData = data.incomes!;
      const expensesData = data.expenses!;
      const taxesData = data.taxes!;

      const totalGrossIncome = incomesData.totalGrossIncome;
      const totalExpenses = expensesData.totalExpenses;
      const totalTaxes = taxesData.incomeTaxes.incomeTaxAmount + taxesData.capitalGainsTaxes.capitalGainsTaxAmount;

      return {
        age: currDateYear - startDateYear + startAge,
        perIncomeData: Object.values(incomesData.perIncomeData),
        perExpenseData: Object.values(expensesData.perExpenseData),
        totalGrossIncome,
        totalExpenses,
        netCashFlow: totalGrossIncome - totalExpenses,
        totalTaxes,
      };
    });
  }, [simulation]);
};

export const useSingleSimulationTaxesChartData = (simulation: SimulationResult): SingleSimulationTaxesChartDataPoint[] => {
  return useMemo(() => {
    return simulation.data.slice(1).map((data) => {
      const startAge = simulation.context.startAge;
      const startDateYear = new Date().getFullYear();
      const currDateYear = new Date(data.date).getFullYear();

      const taxesData = data.taxes!;

      return {
        age: currDateYear - startDateYear + startAge,
        taxableOrdinaryIncome: taxesData.incomeTaxes.taxableOrdinaryIncome,
        incomeTaxAmount: taxesData.incomeTaxes.incomeTaxAmount,
        effectiveIncomeTaxRate: taxesData.incomeTaxes.effectiveIncomeTaxRate,
        topMarginalIncomeTaxRate: taxesData.incomeTaxes.topMarginalTaxRate,
        netIncome: taxesData.incomeTaxes.netIncome,
        capitalLossDeduction: taxesData.incomeTaxes.capitalLossDeduction,
        taxableCapitalGains: taxesData.capitalGainsTaxes.taxableCapitalGains,
        capitalGainsTaxAmount: taxesData.capitalGainsTaxes.capitalGainsTaxAmount,
        effectiveCapitalGainsTaxRate: taxesData.capitalGainsTaxes.effectiveCapitalGainsTaxRate,
        topMarginalCapitalGainsTaxRate: taxesData.capitalGainsTaxes.topMarginalCapitalGainsTaxRate,
        netCapitalGains: taxesData.capitalGainsTaxes.netCapitalGains,
        totalTaxableIncome: taxesData.totalTaxableIncome,
        totalTaxesAmount: taxesData.incomeTaxes.incomeTaxAmount + taxesData.capitalGainsTaxes.capitalGainsTaxAmount,
        totalNetIncome: taxesData.incomeTaxes.netIncome + taxesData.capitalGainsTaxes.netCapitalGains,
      };
    });
  }, [simulation]);
};

export const useSingleSimulationReturnsChartData = (simulation: SimulationResult): SingleSimulationReturnsChartDataPoint[] => {
  return useMemo(() => {
    return simulation.data.slice(1).map((data) => {
      const startAge = simulation.context.startAge;
      const startDateYear = new Date().getFullYear();
      const currDateYear = new Date(data.date).getFullYear();

      const returnsData = data.returns!;

      return {
        age: currDateYear - startDateYear + startAge,
        stocksRate: returnsData.annualReturnRates.stocks,
        bondsRate: returnsData.annualReturnRates.bonds,
        cashRate: returnsData.annualReturnRates.cash,
        inflationRate: returnsData.annualInflationRate,
        totalStocksAmount: returnsData.totalReturnAmounts.stocks,
        totalBondsAmount: returnsData.totalReturnAmounts.bonds,
        totalCashAmount: returnsData.totalReturnAmounts.cash,
        stocksAmount: returnsData.returnAmountsForPeriod.stocks,
        bondsAmount: returnsData.returnAmountsForPeriod.bonds,
        cashAmount: returnsData.returnAmountsForPeriod.cash,
      };
    });
  }, [simulation]);
};

export const useSingleSimulationContributionsChartData = (simulation: SimulationResult): SingleSimulationContributionsChartDataPoint[] => {
  return useMemo(() => {
    return simulation.data.slice(1).map((data) => {
      const startAge = simulation.context.startAge;
      const startDateYear = new Date().getFullYear();
      const currDateYear = new Date(data.date).getFullYear();

      const portfolioData = data.portfolio;

      let cashSavings = 0;
      let taxable = 0;
      let taxDeferred = 0;
      let taxFree = 0;

      for (const account of Object.values(portfolioData.perAccountData)) {
        switch (account.type) {
          case 'savings':
            cashSavings += account.contributionsForPeriod;
            break;
          case 'taxableBrokerage':
            taxable += account.contributionsForPeriod;
            break;
          case '401k':
          case 'ira':
          case 'hsa':
            taxDeferred += account.contributionsForPeriod;
            break;
          case 'roth401k':
          case 'rothIra':
            taxFree += account.contributionsForPeriod;
            break;
        }
      }

      return {
        age: currDateYear - startDateYear + startAge,
        totalContributions: portfolioData.totalContributions,
        annualContributions: portfolioData.contributionsForPeriod,
        perAccountData: Object.values(portfolioData.perAccountData),
        taxable,
        taxDeferred,
        taxFree,
        cashSavings,
      };
    });
  }, [simulation]);
};

export const useSingleSimulationWithdrawalsChartData = (simulation: SimulationResult): SingleSimulationWithdrawalsChartDataPoint[] => {
  return useMemo(() => {
    return simulation.data.slice(1).map((data) => {
      const startAge = simulation.context.startAge;
      const startDateYear = new Date().getFullYear();
      const currDateYear = new Date(data.date).getFullYear();

      const portfolioData = data.portfolio;

      let cashSavings = 0;
      let taxable = 0;
      let taxDeferred = 0;
      let taxFree = 0;

      for (const account of Object.values(portfolioData.perAccountData)) {
        switch (account.type) {
          case 'savings':
            cashSavings += account.withdrawalsForPeriod;
            break;
          case 'taxableBrokerage':
            taxable += account.withdrawalsForPeriod;
            break;
          case '401k':
          case 'ira':
          case 'hsa':
            taxDeferred += account.withdrawalsForPeriod;
            break;
          case 'roth401k':
          case 'rothIra':
            taxFree += account.withdrawalsForPeriod;
            break;
        }
      }

      return {
        age: currDateYear - startDateYear + startAge,
        totalWithdrawals: portfolioData.totalWithdrawals,
        annualWithdrawals: portfolioData.withdrawalsForPeriod,
        totalRealizedGains: portfolioData.totalRealizedGains,
        annualRealizedGains: portfolioData.realizedGainsForPeriod,
        perAccountData: Object.values(portfolioData.perAccountData),
        taxable,
        taxDeferred,
        taxFree,
        cashSavings,
      };
    });
  }, [simulation]);
};

/**
 * Table Hooks
 * These hooks provide access to simulation table data
 */
export const useSingleSimulationTableData = (simulation: SimulationResult, category: SimulationCategory): SingleSimulationTableRow[] => {
  return useMemo(() => {
    const extractor = new TableDataExtractor();
    return extractor.extractSingleSimulationData(simulation, category);
  }, [simulation, category]);
};

/**
 * Real Return Rate Calculations
 * These hooks calculate real (inflation-adjusted) returns using the Fisher equation
 */
export const useStocksRealReturn = () =>
  useQuickPlanStore((state) => {
    const nominalReturn = state.inputs.marketAssumptions.stockReturn;
    const inflationRate = state.inputs.marketAssumptions.inflationRate;
    const realReturn = (1 + nominalReturn / 100) / (1 + inflationRate / 100) - 1;
    return realReturn * 100;
  });

export const useBondsRealReturn = () =>
  useQuickPlanStore((state) => {
    const nominalReturn = state.inputs.marketAssumptions.bondReturn;
    const inflationRate = state.inputs.marketAssumptions.inflationRate;
    const realReturn = (1 + nominalReturn / 100) / (1 + inflationRate / 100) - 1;
    return realReturn * 100;
  });

export const useCashRealReturn = () =>
  useQuickPlanStore((state) => {
    const nominalReturn = state.inputs.marketAssumptions.cashReturn;
    const inflationRate = state.inputs.marketAssumptions.inflationRate;
    const realReturn = (1 + nominalReturn / 100) / (1 + inflationRate / 100) - 1;
    return realReturn * 100;
  });

/**
 * Validation State Selectors
 * These hooks check if sections or the entire form have valid data for calculations
 */
export const useIsCalculationReady = () =>
  useQuickPlanStore(
    (state) =>
      state.inputs.timeline !== undefined &&
      Object.keys(state.inputs.accounts).length > 0 &&
      Object.keys(state.inputs.incomes).length > 0 &&
      Object.keys(state.inputs.expenses).length > 0
  );
