'use client';

import * as Comlink from 'comlink';
import { useMemo, useEffect, useState, useCallback } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import useSWR, { mutate } from 'swr';
import { v4 as uuidv4 } from 'uuid';

import type { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';
import { FinancialSimulationEngine, type SimulationResult } from '@/lib/calc/v2/simulation-engine';
import type { MultiSimulationAnalysis } from '@/lib/calc/v2/multi-simulation-analyzer';
import { FixedReturnsProvider } from '@/lib/calc/returns-providers/fixed-returns-provider';
import { StochasticReturnsProvider } from '@/lib/calc/returns-providers/stochastic-returns-provider';
import { LcgHistoricalBacktestReturnsProvider } from '@/lib/calc/returns-providers/lcg-historical-backtest-returns-provider';
import { ChartDataExtractor } from '@/lib/calc/v2/chart-data-extractor';
import { TableDataExtractor } from '@/lib/calc/v2/table-data-extractor';
import { SimulationDataExtractor } from '@/lib/utils/simulation-data-extractor';
import { createWorkerPool, releaseWorkerPool } from '@/lib/workers/simulation-worker-api';
import { getMergeWorker } from '@/lib/workers/merge-worker-api';
import type {
  SingleSimulationPortfolioTableRow,
  SingleSimulationCashFlowTableRow,
  SingleSimulationReturnsTableRow,
  SingleSimulationTaxesTableRow,
  SingleSimulationContributionsTableRow,
  SingleSimulationWithdrawalsTableRow,
} from '@/lib/schemas/single-simulation-table-schema';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/multi-simulation-table-schema';
import type { IncomeInputs } from '@/lib/schemas/income-form-schema';
import type { AccountInputs } from '@/lib/schemas/account-form-schema';
import type { ExpenseInputs } from '@/lib/schemas/expense-form-schema';
import type { TimelineInputs } from '@/lib/schemas/timeline-form-schema';
import type { ContributionInputs, BaseContributionInputs } from '@/lib/schemas/contribution-form-schema';
import type { MarketAssumptionsInputs } from '@/lib/schemas/market-assumptions-schema';
import type { SimulationSettingsInputs } from '@/lib/schemas/simulation-settings-schema';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import type {
  SingleSimulationPortfolioChartDataPoint,
  SingleSimulationCashFlowChartDataPoint,
  SingleSimulationTaxesChartDataPoint,
  SingleSimulationReturnsChartDataPoint,
  SingleSimulationContributionsChartDataPoint,
  SingleSimulationWithdrawalsChartDataPoint,
  MultiSimulationChartData,
} from '@/lib/types/chart-data-points';
import { SimulationCategory } from '@/lib/types/simulation-category';
import { usePrevious } from '@/hooks/use-previous';

// ================================
// STATE INTERFACE & DEFAULT STATE
// ================================

export const simulationModes = [
  'fixedReturns',
  'stochasticReturns',
  'historicalReturns',
  'monteCarloStochasticReturns',
  'monteCarloHistoricalReturns',
] as const;

export type SimulationMode = (typeof simulationModes)[number];

export type MonteCarloSortMode =
  | 'finalPortfolioValue'
  | 'retirementAge'
  | 'bankruptcyAge'
  | 'averageStockReturn'
  | 'earlyRetirementStockReturn';

export type QuickSelectPercentile = 'p10' | 'p25' | 'p50' | 'p75' | 'p90' | null;
export type SimulationStatus = 'none' | 'loading';

interface QuickPlanState {
  inputs: QuickPlanInputs;

  results: {
    quickSelectPercentile: QuickSelectPercentile;
    selectedSeedFromTable: number | null;
    selectedSeedFromQuickPercentile: number | null;
    simulationStatus: SimulationStatus;
    category: SimulationCategory;
  };

  preferences: {
    dataStorage: 'localStorage' | 'none';
    showReferenceLines: boolean;
    simulationSeed: number;
    sidebarCollapsed: boolean;
    simulationSettings: SimulationSettingsInputs;
    monteCarloSortMode: MonteCarloSortMode;
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

    /* Results */
    updateQuickSelectPercentile: (percentile: QuickSelectPercentile) => void;
    updateSelectedSeedFromTable: (seed: number | null) => void;
    updateSelectedSeedFromQuickPercentile: (seed: number | null) => void;
    updateSimulationStatus: (status: SimulationStatus) => void;
    updateCategory: (category: SimulationCategory) => void;

    /* Preferences */
    updateDataStoragePreference: (value: QuickPlanState['preferences']['dataStorage']) => void;
    updateShowReferenceLines: (value: boolean) => void;
    updateSimulationSeed: () => void;
    updateSidebarCollapsed: (value: boolean) => void;
    updateSimulationSettings: (data: SimulationSettingsInputs) => void;
    updateMonteCarloSortMode: (value: QuickPlanState['preferences']['monteCarloSortMode']) => void;

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
    marketAssumptions: { stockReturn: 10, stockYield: 3.5, bondReturn: 5, bondYield: 4.5, cashReturn: 3, inflationRate: 3 },
  },
  results: {
    quickSelectPercentile: 'p50',
    selectedSeedFromTable: null,
    selectedSeedFromQuickPercentile: null,
    simulationStatus: 'none',
    category: SimulationCategory.Portfolio,
  },
  preferences: {
    dataStorage: 'localStorage',
    showReferenceLines: true,
    simulationSeed: 9521,
    sidebarCollapsed: false,
    simulationSettings: { simulationMode: 'historicalReturns' },
    monteCarloSortMode: 'finalPortfolioValue',
  },
};

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
          updateQuickSelectPercentile: (percentile) =>
            set((state) => {
              state.results.quickSelectPercentile = percentile;
            }),
          updateSelectedSeedFromTable: (seed) =>
            set((state) => {
              state.results.selectedSeedFromTable = seed;
            }),
          updateSelectedSeedFromQuickPercentile: (seed) =>
            set((state) => {
              state.results.selectedSeedFromQuickPercentile = seed;
            }),
          updateSimulationStatus: (status) =>
            set((state) => {
              state.results.simulationStatus = status;
            }),
          updateCategory: (category) =>
            set((state) => {
              state.results.category = category;
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
          updateSimulationSettings: (data) =>
            set((state) => {
              state.preferences.simulationSettings = { ...data };
            }),
          updateMonteCarloSortMode: (value) =>
            set((state) => {
              state.preferences.monteCarloSortMode = value;
            }),
          resetStore: () =>
            set((state) => {
              state.inputs = { ...defaultState.inputs };
            }),
        },
      })),
      {
        name: 'quick-plan-storage',
        version: 5,
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
export const useCurrentAge = () => useQuickPlanStore((state) => state.inputs.timeline?.currentAge);

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

export const useQuickSelectPercentile = () => useQuickPlanStore((state) => state.results.quickSelectPercentile);
export const useSelectedSeedFromTable = () => useQuickPlanStore((state) => state.results.selectedSeedFromTable);
export const useSelectedSeedFromQuickPercentile = () => useQuickPlanStore((state) => state.results.selectedSeedFromQuickPercentile);
export const useSimulationStatus = () => useQuickPlanStore((state) => state.results.simulationStatus);
export const useResultsCategory = () => useQuickPlanStore((state) => state.results.category);

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

export const useUpdateQuickSelectPercentile = () => useQuickPlanStore((state) => state.actions.updateQuickSelectPercentile);
export const useUpdateSelectedSeedFromTable = () => useQuickPlanStore((state) => state.actions.updateSelectedSeedFromTable);
export const useUpdateSelectedSeedFromQuickPercentile = () =>
  useQuickPlanStore((state) => state.actions.updateSelectedSeedFromQuickPercentile);
export const useUpdateSimulationStatus = () => useQuickPlanStore((state) => state.actions.updateSimulationStatus);
export const useUpdateResultsCategory = () => useQuickPlanStore((state) => state.actions.updateCategory);
export const useUpdateDataStoragePreference = () => useQuickPlanStore((state) => state.actions.updateDataStoragePreference);
export const useUpdateShowReferenceLines = () => useQuickPlanStore((state) => state.actions.updateShowReferenceLines);
export const useUpdateSimulationSeed = () => useQuickPlanStore((state) => state.actions.updateSimulationSeed);
export const useUpdateSidebarCollapsed = () => useQuickPlanStore((state) => state.actions.updateSidebarCollapsed);
export const useUpdateSimulationSettings = () => useQuickPlanStore((state) => state.actions.updateSimulationSettings);
export const useUpdateMonteCarloSortMode = () => useQuickPlanStore((state) => state.actions.updateMonteCarloSortMode);

/**
 * Preferences selectors
 * These hooks manage user preferences and settings
 */
export const useDataStoragePreference = () => useQuickPlanStore((state) => state.preferences.dataStorage);
export const useShowReferenceLines = () => useQuickPlanStore((state) => state.preferences.showReferenceLines);
export const useSimulationSeed = () => useQuickPlanStore((state) => state.preferences.simulationSeed);
export const useSidebarCollapsed = () => useQuickPlanStore((state) => state.preferences.sidebarCollapsed);
export const useSimulationSettings = () => useQuickPlanStore((state) => state.preferences.simulationSettings);
export const useSimulationMode = () => useQuickPlanStore((state) => state.preferences.simulationSettings.simulationMode);
export const useMonteCarloSortMode = () => useQuickPlanStore((state) => state.preferences.monteCarloSortMode);

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
  const hasSeedOverride = seedOverride !== undefined && seedOverride !== null;
  const inputs = useQuickPlanStore((state) => state.inputs);

  const preferencesSeed = useSimulationSeed();
  const seed = hasSeedOverride ? seedOverride : preferencesSeed;

  let startYearOverride = useQuickPlanStore((state) => state.preferences.simulationSettings.historicalStartYearOverride);
  startYearOverride = !hasSeedOverride ? startYearOverride : undefined;

  let retirementStartYearOverride = useQuickPlanStore(
    (state) => state.preferences.simulationSettings.historicalRetirementStartYearOverride
  );
  retirementStartYearOverride = !hasSeedOverride ? retirementStartYearOverride : undefined;

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
        const returnsProvider = new LcgHistoricalBacktestReturnsProvider(seed, startYearOverride, retirementStartYearOverride);
        const res = engine.runSimulation(returnsProvider, timeline);
        const historicalRanges = returnsProvider.getHistoricalRanges();
        return {
          ...res,
          context: {
            ...res.context,
            historicalRanges,
          },
        };
      }
    }
  }, [inputs, seed, simulationMode, startYearOverride, retirementStartYearOverride]);
};

export const useMultiSimulationResult = (
  simulationMode: 'monteCarloStochasticReturns' | 'monteCarloHistoricalReturns'
): {
  analysis: MultiSimulationAnalysis | undefined;
  tableData: MultiSimulationTableRow[] | undefined;
  yearlyTableData: YearlyAggregateTableRow[] | undefined;
  chartData: MultiSimulationChartData | undefined;
  isLoadingOrValidating: boolean;
  completedSimulations: number;
} => {
  const inputs = useQuickPlanStore((state) => state.inputs);
  const simulationSeed = useSimulationSeed();
  const mergeWorker = getMergeWorker();

  const [completedSimulations, setCompletedSimulations] = useState(0);
  const onProgress = useCallback(() => setCompletedSimulations((prev) => prev + 1), []);

  const swrOptions = { revalidateOnFocus: false, revalidateIfStale: false, revalidateOnReconnect: false };

  const swrKey = ['simulationHandle', inputs, simulationSeed, simulationMode];
  const {
    data: handleData,
    isLoading,
    isValidating,
  } = useSWR(
    swrKey,
    async () => {
      await mutate(() => true, undefined, { revalidate: false });
      setCompletedSimulations(0);

      const pool = createWorkerPool();

      const chunks: number[] = [];
      for (let i = 0; i < 500; i += 10) {
        chunks.push(Math.min(10, 500 - i));
      }

      let chunkIndex = 0;
      const getNextChunk = () => {
        if (chunkIndex >= chunks.length) return null;
        return { size: chunks[chunkIndex], seed: simulationSeed + chunkIndex * 9973, index: chunkIndex++ };
      };

      await Promise.all(
        pool.map(async (worker) => {
          let chunk;
          while ((chunk = getNextChunk())) {
            await worker.runSimulation(inputs, chunk.seed, chunk.size, simulationMode, mergeWorker, Comlink.proxy(onProgress));
          }
        })
      );

      releaseWorkerPool();
      return mergeWorker.getMergedResult();
    },
    swrOptions
  );

  const handle = handleData?.handle;
  const prevHandle = usePrevious(handle);

  const sortMode = useMonteCarloSortMode();
  const category = useResultsCategory();
  const { data: { analysis, tableData, yearlyTableData, chartData } = {} } = useSWR(
    handle ? ['derived', handle, sortMode, category] : null,
    () => mergeWorker.getDerivedMultiSimulationData(handle!, sortMode, category),
    { ...swrOptions, keepPreviousData: prevHandle === handle }
  );

  const quickSelectPercentile = useQuickSelectPercentile();
  const updateSelectedSeedFromPercentile = useUpdateSelectedSeedFromQuickPercentile();
  useEffect(() => {
    const seed = quickSelectPercentile !== null ? (analysis?.results[quickSelectPercentile].seed ?? null) : null;
    updateSelectedSeedFromPercentile(seed);
  }, [analysis?.results, quickSelectPercentile, updateSelectedSeedFromPercentile]);

  const updateSimulationStatus = useUpdateSimulationStatus();
  useEffect(() => {
    updateSimulationStatus(isLoading || isValidating ? 'loading' : 'none');
  }, [isLoading, isValidating, updateSimulationStatus]);

  return { analysis, tableData, yearlyTableData, chartData, isLoadingOrValidating: isLoading || isValidating, completedSimulations };
};

export const useKeyMetrics = (simulationResult: SimulationResult | null | undefined): KeyMetrics | null => {
  return useMemo(() => {
    if (!simulationResult) return null;
    const { data, context } = simulationResult;

    const startAge = context.startAge;
    const retirementStrategy = context.retirementStrategy;

    const initialPortfolio = data[0].portfolio.totalValue;
    const finalPortfolio = data[data.length - 1].portfolio.totalValue;

    let retirementAge: number | null = null;
    let yearsToRetirement: number | null = null;

    const { bankruptcyAge, yearsToBankruptcy } = SimulationDataExtractor.getMilestonesData(data, startAge);

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
            ({ retirementAge, yearsToRetirement } = SimulationDataExtractor.getMilestonesData(data, startAge));

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
      bankruptcyAge,
      yearsToBankruptcy,
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
    const extractor = new ChartDataExtractor();
    return extractor.extractSingleSimulationPortfolioChartData(simulation);
  }, [simulation]);
};

export const useSingleSimulationCashFlowChartData = (simulation: SimulationResult): SingleSimulationCashFlowChartDataPoint[] => {
  return useMemo(() => {
    const extractor = new ChartDataExtractor();
    return extractor.extractSingleSimulationCashFlowChartData(simulation);
  }, [simulation]);
};

export const useSingleSimulationTaxesChartData = (simulation: SimulationResult): SingleSimulationTaxesChartDataPoint[] => {
  return useMemo(() => {
    const extractor = new ChartDataExtractor();
    return extractor.extractSingleSimulationTaxesChartData(simulation);
  }, [simulation]);
};

export const useSingleSimulationReturnsChartData = (simulation: SimulationResult): SingleSimulationReturnsChartDataPoint[] => {
  return useMemo(() => {
    const extractor = new ChartDataExtractor();
    return extractor.extractSingleSimulationReturnsChartData(simulation);
  }, [simulation]);
};

export const useSingleSimulationContributionsChartData = (simulation: SimulationResult): SingleSimulationContributionsChartDataPoint[] => {
  return useMemo(() => {
    const extractor = new ChartDataExtractor();
    return extractor.extractSingleSimulationContributionsChartData(simulation);
  }, [simulation]);
};

export const useSingleSimulationWithdrawalsChartData = (simulation: SimulationResult): SingleSimulationWithdrawalsChartDataPoint[] => {
  return useMemo(() => {
    const extractor = new ChartDataExtractor();
    return extractor.extractSingleSimulationWithdrawalsChartData(simulation);
  }, [simulation]);
};

/**
 * Table Hooks
 * These hooks provide access to simulation table data
 */
export const useSingleSimulationPortfolioTableData = (simulation: SimulationResult): SingleSimulationPortfolioTableRow[] => {
  return useMemo(() => {
    const extractor = new TableDataExtractor();
    return extractor.extractSingleSimulationPortfolioData(simulation);
  }, [simulation]);
};

export const useSingleSimulationCashFlowTableData = (simulation: SimulationResult): SingleSimulationCashFlowTableRow[] => {
  return useMemo(() => {
    const extractor = new TableDataExtractor();
    return extractor.extractSingleSimulationCashFlowData(simulation);
  }, [simulation]);
};

export const useSingleSimulationReturnsTableData = (simulation: SimulationResult): SingleSimulationReturnsTableRow[] => {
  return useMemo(() => {
    const extractor = new TableDataExtractor();
    return extractor.extractSingleSimulationReturnsData(simulation);
  }, [simulation]);
};

export const useSingleSimulationTaxesTableData = (simulation: SimulationResult): SingleSimulationTaxesTableRow[] => {
  return useMemo(() => {
    const extractor = new TableDataExtractor();
    return extractor.extractSingleSimulationTaxesData(simulation);
  }, [simulation]);
};

export const useSingleSimulationContributionsTableData = (simulation: SimulationResult): SingleSimulationContributionsTableRow[] => {
  return useMemo(() => {
    const extractor = new TableDataExtractor();
    return extractor.extractSingleSimulationContributionsData(simulation);
  }, [simulation]);
};

export const useSingleSimulationWithdrawalsTableData = (simulation: SimulationResult): SingleSimulationWithdrawalsTableRow[] => {
  return useMemo(() => {
    const extractor = new TableDataExtractor();
    return extractor.extractSingleSimulationWithdrawalsData(simulation);
  }, [simulation]);
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
export const useIsCalculationReady = () => {
  const timeline = useTimelineData();
  const accounts = useAccountsData();
  const incomes = useIncomesData();
  const expenses = useExpensesData();

  return {
    timelineIsReady: timeline !== undefined,
    accountsAreReady: Object.keys(accounts).length > 0,
    incomesAreReady: Object.keys(incomes).length > 0,
    expensesAreReady: Object.keys(expenses).length > 0,
  };
};
