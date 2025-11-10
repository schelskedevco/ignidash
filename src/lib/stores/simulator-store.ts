'use client';

import type { Id } from '@/convex/_generated/dataModel';
import * as Comlink from 'comlink';
import { useMemo, useEffect, useState, useCallback } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import useSWR, { mutate } from 'swr';

import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';
import { FinancialSimulationEngine, type SimulationResult } from '@/lib/calc/simulation-engine';
import type { MultiSimulationAnalysis } from '@/lib/calc/analysis/multi-simulation-analyzer';
import { FixedReturnsProvider } from '@/lib/calc/returns-providers/fixed-returns-provider';
import { StochasticReturnsProvider } from '@/lib/calc/returns-providers/stochastic-returns-provider';
import { LcgHistoricalBacktestReturnsProvider } from '@/lib/calc/returns-providers/lcg-historical-backtest-returns-provider';
import { KeyMetricsExtractor } from '@/lib/calc/data-extractors/key-metrics-extractor';
import { ChartDataExtractor } from '@/lib/calc/data-extractors/chart-data-extractor';
import { TableDataExtractor } from '@/lib/calc/data-extractors/table-data-extractor';
import { createWorkerPool, releaseWorkerPool } from '@/lib/workers/simulation-worker-api';
import { getMergeWorker } from '@/lib/workers/merge-worker-api';
import type {
  SingleSimulationPortfolioTableRow,
  SingleSimulationCashFlowTableRow,
  SingleSimulationReturnsTableRow,
  SingleSimulationTaxesTableRow,
  SingleSimulationContributionsTableRow,
  SingleSimulationWithdrawalsTableRow,
} from '@/lib/schemas/tables/single-simulation-table-schema';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/tables/multi-simulation-table-schema';
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
  | 'meanStockReturn'
  | 'earlyRetirementStockReturn';

export type QuickSelectPercentile = 'p10' | 'p25' | 'p50' | 'p75' | 'p90' | null;
export type SimulationStatus = 'none' | 'loading';

interface SimulatorState {
  selectedPlanId: Id<'plans'> | null;

  results: {
    quickSelectPercentile: QuickSelectPercentile;
    selectedSeedFromTable: number | null;
    selectedSeedFromQuickPercentile: number | null;
    simulationStatus: SimulationStatus;
    category: SimulationCategory;
    simulationSeed: number;
    simulationSettings: SimulationSettingsInputs;
    monteCarloSortMode: MonteCarloSortMode;
  };

  preferences: {
    showReferenceLines: boolean;
    sidebarCollapsed: boolean;
  };

  actions: {
    /* Plan */
    updateSelectedPlanId: (id: Id<'plans'>) => void;

    /* Results */
    updateQuickSelectPercentile: (percentile: QuickSelectPercentile) => void;
    updateSelectedSeedFromTable: (seed: number | null) => void;
    updateSelectedSeedFromQuickPercentile: (seed: number | null) => void;
    updateSimulationStatus: (status: SimulationStatus) => void;
    updateCategory: (category: SimulationCategory) => void;
    updateSimulationSeed: () => void;
    updateSimulationSettings: (data: SimulationSettingsInputs) => void;
    updateMonteCarloSortMode: (value: SimulatorState['results']['monteCarloSortMode']) => void;

    /* Preferences */
    updateShowReferenceLines: (value: boolean) => void;
    updateSidebarCollapsed: (value: boolean) => void;
  };
}

export const defaultState: Omit<SimulatorState, 'actions'> = {
  selectedPlanId: 'jd7aqt0x9h0jsf453dc0kn1r197v47gv' as Id<'plans'>, // Demo Plan
  results: {
    quickSelectPercentile: 'p50',
    selectedSeedFromTable: null,
    selectedSeedFromQuickPercentile: null,
    simulationStatus: 'none',
    category: SimulationCategory.Portfolio,
    simulationSeed: 9521,
    simulationSettings: { simulationMode: 'fixedReturns' },
    monteCarloSortMode: 'finalPortfolioValue',
  },
  preferences: {
    showReferenceLines: true,
    sidebarCollapsed: false,
  },
};

// ================================
// STORE CREATION
// ================================

export const useSimulatorStore = create<SimulatorState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...defaultState,
        actions: {
          updateSelectedPlanId: (id) =>
            set((state) => {
              state.selectedPlanId = id;
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
          updateSimulationSeed: () =>
            set((state) => {
              state.results.simulationSeed = Math.floor(Math.random() * 1000);
            }),
          updateSimulationSettings: (data) =>
            set((state) => {
              state.results.simulationSettings = { ...data };
            }),
          updateMonteCarloSortMode: (value) =>
            set((state) => {
              state.results.monteCarloSortMode = value;
            }),
          updateShowReferenceLines: (value) =>
            set((state) => {
              state.preferences.showReferenceLines = value;
            }),
          updateSidebarCollapsed: (value) =>
            set((state) => {
              state.preferences.sidebarCollapsed = value;
            }),
        },
      })),
      {
        name: 'quick-plan-storage',
        version: 9,
        migrate: () => ({ ...defaultState }),
        partialize: (state) => {
          const baseResult = { preferences: state.preferences };

          return baseResult;
        },
      }
    ),
    {
      name: 'Simulator Store',
      anonymousActionType: 'simulator/action',
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
export const useSelectedPlanId = () => useSimulatorStore((state) => state.selectedPlanId)!;
export const useQuickSelectPercentile = () => useSimulatorStore((state) => state.results.quickSelectPercentile);
export const useSelectedSeedFromTable = () => useSimulatorStore((state) => state.results.selectedSeedFromTable);
export const useSelectedSeedFromQuickPercentile = () => useSimulatorStore((state) => state.results.selectedSeedFromQuickPercentile);
export const useSimulationStatus = () => useSimulatorStore((state) => state.results.simulationStatus);
export const useResultsCategory = () => useSimulatorStore((state) => state.results.category);
export const useSimulationSeed = () => useSimulatorStore((state) => state.results.simulationSeed);
export const useSimulationSettings = () => useSimulatorStore((state) => state.results.simulationSettings);
export const useSimulationMode = () => useSimulatorStore((state) => state.results.simulationSettings.simulationMode);
export const useMonteCarloSortMode = () => useSimulatorStore((state) => state.results.monteCarloSortMode);

/**
 * Action selectors
 * These hooks provide access to update functions with built-in validation
 */
export const useUpdateSelectedPlanId = () => useSimulatorStore((state) => state.actions.updateSelectedPlanId);
export const useUpdateQuickSelectPercentile = () => useSimulatorStore((state) => state.actions.updateQuickSelectPercentile);
export const useUpdateSelectedSeedFromTable = () => useSimulatorStore((state) => state.actions.updateSelectedSeedFromTable);
export const useUpdateSelectedSeedFromQuickPercentile = () =>
  useSimulatorStore((state) => state.actions.updateSelectedSeedFromQuickPercentile);
export const useUpdateSimulationStatus = () => useSimulatorStore((state) => state.actions.updateSimulationStatus);
export const useUpdateResultsCategory = () => useSimulatorStore((state) => state.actions.updateCategory);
export const useUpdateShowReferenceLines = () => useSimulatorStore((state) => state.actions.updateShowReferenceLines);
export const useUpdateSimulationSeed = () => useSimulatorStore((state) => state.actions.updateSimulationSeed);
export const useUpdateSidebarCollapsed = () => useSimulatorStore((state) => state.actions.updateSidebarCollapsed);
export const useUpdateSimulationSettings = () => useSimulatorStore((state) => state.actions.updateSimulationSettings);
export const useUpdateMonteCarloSortMode = () => useSimulatorStore((state) => state.actions.updateMonteCarloSortMode);

/**
 * Preferences selectors
 * These hooks manage user preferences and settings
 */
export const useShowReferenceLines = () => useSimulatorStore((state) => state.preferences.showReferenceLines);
export const useSidebarCollapsed = () => useSimulatorStore((state) => state.preferences.sidebarCollapsed);

/**
 * Simulation & Analysis Hooks
 * These hooks provide access to simulation and analysis functions
 */
export const useSimulationResult = (
  inputs: SimulatorInputs,
  simulationMode: 'fixedReturns' | 'stochasticReturns' | 'historicalReturns',
  seedOverride?: number | null
): SimulationResult | null => {
  const hasSeedOverride = seedOverride !== undefined && seedOverride !== null;

  const preferencesSeed = useSimulationSeed();
  const seed = hasSeedOverride ? seedOverride : preferencesSeed;

  let startYearOverride = useSimulatorStore((state) => state.results.simulationSettings.historicalStartYearOverride);
  startYearOverride = !hasSeedOverride ? startYearOverride : undefined;

  let retirementStartYearOverride = useSimulatorStore((state) => state.results.simulationSettings.historicalRetirementStartYearOverride);
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
  inputs: SimulatorInputs,
  simulationMode: 'monteCarloStochasticReturns' | 'monteCarloHistoricalReturns'
): {
  analysis: MultiSimulationAnalysis | undefined;
  tableData: MultiSimulationTableRow[] | undefined;
  yearlyTableData: YearlyAggregateTableRow[] | undefined;
  chartData: MultiSimulationChartData | undefined;
  keyMetrics: KeyMetrics | undefined;
  isLoadingOrValidating: boolean;
  completedSimulations: number;
} => {
  const simulationSeed = useSimulationSeed();
  const mergeWorker = getMergeWorker();

  const [completedSimulations, setCompletedSimulations] = useState(0);
  const onProgress = useCallback(() => setCompletedSimulations((prev) => prev + 1), []);

  useEffect(() => {
    setCompletedSimulations(0);
  }, [simulationSeed, simulationMode]);

  const swrOptions = { revalidateOnFocus: false, revalidateIfStale: false, revalidateOnReconnect: false };

  const swrKey = ['simulationHandle', simulationSeed, simulationMode];
  const {
    data: handleData,
    isLoading,
    isValidating,
  } = useSWR(
    swrKey,
    async () => {
      await Promise.all([mutate(() => true, undefined, { revalidate: false }), mergeWorker.reset()]);

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
  const { data: { analysis, tableData, yearlyTableData, chartData, keyMetrics } = {} } = useSWR(
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

  return {
    analysis,
    tableData,
    yearlyTableData,
    chartData,
    keyMetrics,
    isLoadingOrValidating: isLoading || isValidating,
    completedSimulations,
  };
};

export const useKeyMetrics = (simulationResult: SimulationResult | null | undefined): KeyMetrics | null => {
  return useMemo(() => {
    if (!simulationResult) return null;
    return KeyMetricsExtractor.extractSingleSimulationMetrics(simulationResult);
  }, [simulationResult]);
};

/**
 * Single Simulation Chart Hooks
 * These hooks provide access to single simulation chart data
 */
export const useSingleSimulationPortfolioChartData = (simulation: SimulationResult): SingleSimulationPortfolioChartDataPoint[] => {
  return useMemo(() => {
    return ChartDataExtractor.extractSingleSimulationPortfolioChartData(simulation);
  }, [simulation]);
};

export const useSingleSimulationCashFlowChartData = (simulation: SimulationResult): SingleSimulationCashFlowChartDataPoint[] => {
  return useMemo(() => {
    return ChartDataExtractor.extractSingleSimulationCashFlowChartData(simulation);
  }, [simulation]);
};

export const useSingleSimulationTaxesChartData = (simulation: SimulationResult): SingleSimulationTaxesChartDataPoint[] => {
  return useMemo(() => {
    return ChartDataExtractor.extractSingleSimulationTaxesChartData(simulation);
  }, [simulation]);
};

export const useSingleSimulationReturnsChartData = (simulation: SimulationResult): SingleSimulationReturnsChartDataPoint[] => {
  return useMemo(() => {
    return ChartDataExtractor.extractSingleSimulationReturnsChartData(simulation);
  }, [simulation]);
};

export const useSingleSimulationContributionsChartData = (simulation: SimulationResult): SingleSimulationContributionsChartDataPoint[] => {
  return useMemo(() => {
    return ChartDataExtractor.extractSingleSimulationContributionsChartData(simulation);
  }, [simulation]);
};

export const useSingleSimulationWithdrawalsChartData = (simulation: SimulationResult): SingleSimulationWithdrawalsChartDataPoint[] => {
  return useMemo(() => {
    return ChartDataExtractor.extractSingleSimulationWithdrawalsChartData(simulation);
  }, [simulation]);
};

/**
 * Table Hooks
 * These hooks provide access to simulation table data
 */
export const useSingleSimulationPortfolioTableData = (simulation: SimulationResult): SingleSimulationPortfolioTableRow[] => {
  return useMemo(() => {
    return TableDataExtractor.extractSingleSimulationPortfolioData(simulation);
  }, [simulation]);
};

export const useSingleSimulationCashFlowTableData = (simulation: SimulationResult): SingleSimulationCashFlowTableRow[] => {
  return useMemo(() => {
    return TableDataExtractor.extractSingleSimulationCashFlowData(simulation);
  }, [simulation]);
};

export const useSingleSimulationReturnsTableData = (simulation: SimulationResult): SingleSimulationReturnsTableRow[] => {
  return useMemo(() => {
    return TableDataExtractor.extractSingleSimulationReturnsData(simulation);
  }, [simulation]);
};

export const useSingleSimulationTaxesTableData = (simulation: SimulationResult): SingleSimulationTaxesTableRow[] => {
  return useMemo(() => {
    return TableDataExtractor.extractSingleSimulationTaxesData(simulation);
  }, [simulation]);
};

export const useSingleSimulationContributionsTableData = (simulation: SimulationResult): SingleSimulationContributionsTableRow[] => {
  return useMemo(() => {
    return TableDataExtractor.extractSingleSimulationContributionsData(simulation);
  }, [simulation]);
};

export const useSingleSimulationWithdrawalsTableData = (simulation: SimulationResult): SingleSimulationWithdrawalsTableRow[] => {
  return useMemo(() => {
    return TableDataExtractor.extractSingleSimulationWithdrawalsData(simulation);
  }, [simulation]);
};

/**
 * Validation State Selectors
 * These hooks check if sections or the entire form have valid data for calculations
 */
export const useIsCalculationReady = (inputs: SimulatorInputs | null) => {
  if (!inputs) return { timelineIsReady: false, accountsAreReady: false, incomesAreReady: false, expensesAreReady: false };

  const { timeline, accounts, incomes, expenses } = inputs;

  return {
    timelineIsReady: timeline !== undefined,
    accountsAreReady: Object.keys(accounts).length > 0,
    incomesAreReady: Object.keys(incomes).length > 0,
    expensesAreReady: Object.keys(expenses).length > 0,
  };
};
