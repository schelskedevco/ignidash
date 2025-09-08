/**
 * Quick Plan Store - Financial Planning State Management
 *
 * This Zustand store manages the state for a comprehensive financial planning application.
 * It handles user inputs across multiple categories (basics, growth rates, allocation, goals,
 * market assumptions, retirement funding) and provides computed selectors for FIRE calculations,
 * portfolio analysis, and validation states.
 *
 * Architecture:
 * - Uses Zustand with Immer for immutable state updates
 * - Persistent storage with selective data retention based on user preferences
 * - Comprehensive validation using schema validation functions
 * - Computed selectors for derived data and calculations
 * - Modular hook exports for optimal React component integration
 *
 * Key Features:
 * - Form validation with error reporting
 * - Selective localStorage persistence
 * - FIRE (Financial Independence, Retire Early) calculations
 * - Portfolio and asset analysis
 * - Performance-optimized selectors
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import useSWR from 'swr';

import {
  type QuickPlanInputs,
  type BasicsInputs,
  type GrowthRatesInputs,
  type AllocationInputs,
  type GoalsInputs,
  type MarketAssumptionsInputs,
  type RetirementFundingInputs,
  validateField,
  validateSection,
} from '@/lib/schemas/quick-plan-schema';
import {
  FinancialSimulationEngine,
  MonteCarloSimulationEngine,
  LcgHistoricalBacktestSimulationEngine,
  type SimulationResult,
  type MultiSimulationResult,
} from '@/lib/calc/simulation-engine';
import {
  FinancialSimulationEngine as FinancialSimulationEngineV2,
  type SimulationResult as SimulationResultV2,
} from '@/lib/calc/v2/simulation-engine';
import { FixedReturnsProvider } from '@/lib/calc/fixed-returns-provider';
import type { AggregateSimulationStats } from '@/lib/calc/simulation-analyzer';
import { SimulationTableDataExtractor } from '@/lib/calc/simulation-table-data-extractor';
import WithdrawalStrategy from '@/lib/calc/withdrawal-strategy';
import { getSimulationWorker } from '@/lib/workers/simulation-worker-api';
import type { MultiSimulationResultDTO } from '@/lib/schemas/simulation-dto-schema';
import type { SimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/simulation-table-schema';
import type { IncomeInputs } from '@/lib/schemas/income-form-schema';
import type { AccountInputs } from '@/lib/schemas/account-form-schema';
import type { ExpenseInputs } from '@/lib/schemas/expense-form-schema';
import type { TimelineInputs } from '@/lib/schemas/timeline-form-schema';
import type { ContributionInputs, BaseContributionInputs } from '@/lib/schemas/contribution-form-schema';
import { Portfolio } from '@/lib/calc/portfolio';
import { SimulationPhase, AccumulationPhase, RetirementPhase, type PhaseType } from '@/lib/calc/simulation-phase';

// ================================
// TYPES & HELPERS
// ================================

export type UpdateResult = {
  success: boolean;
  error?: string;
};

type TouchedState = {
  [K in keyof QuickPlanInputs]: boolean;
};

type ErrorState = {
  [K in keyof QuickPlanInputs]?: {
    [F in keyof QuickPlanInputs[K]]?: string;
  };
};

/**
 * Helper function to create update actions with validation
 * Reduces code duplication across all update methods
 *
 * @param section - The section name for validation
 * @param set - Zustand set function for state updates
 * @param get - Zustand get function for current state access
 * @returns Update function that validates and updates a single field
 */
const createSimpleUpdateAction = <T extends keyof QuickPlanInputs>(
  section: T,
  set: (fn: (state: QuickPlanState) => void) => void,
  get: () => QuickPlanState,
  shouldUpdateTouchedState: boolean = true
) => {
  return (field: keyof QuickPlanInputs[T], value: unknown): UpdateResult => {
    const currentSection = get().inputs[section];
    const currentValue = currentSection[field];

    // Skip update if the new value is equivalent to the current value
    if (value == currentValue) return { success: true };

    const result = validateField(section, field, value, currentSection);

    if (result.valid && result.data) {
      set((state) => {
        state.inputs[section] = result.data!;
        if (shouldUpdateTouchedState) {
          if (value) {
            state.touched[section] = true;
          } else {
            state.touched[section] = false;
          }
        }
        if (state.errors[section]) delete state.errors[section][field];
      });
    } else {
      set((state) => {
        if (shouldUpdateTouchedState) {
          state.touched[section] = true;
        }
        state.errors[section] = {
          ...state.errors[section],
          [field]: result.error,
        };
      });
    }

    return {
      success: result.valid,
      error: result.error,
    };
  };
};

/**
 * Reconstructs the simulation result from the DTO format.
 * @param dto The DTO to reconstruct.
 * @returns The reconstructed simulation result.
 */
function reconstructSimulationResult(dto: MultiSimulationResultDTO): MultiSimulationResult {
  function reconstructPhase(phaseType: PhaseType): SimulationPhase {
    switch (phaseType) {
      case 'retirement':
        return new RetirementPhase();
      case 'accumulation':
        return new AccumulationPhase();
    }
  }

  return {
    simulations: dto.simulations.map(([seed, sim]) => [
      seed,
      {
        ...sim,
        data: sim.data.map(([time, portfolioData]) => [
          time,
          Portfolio.create(portfolioData.assets, portfolioData.contributions, portfolioData.withdrawals),
        ]),
        phasesMetadata: sim.phasesMetadata.map(([time, phaseType]) => [time, reconstructPhase(phaseType)]),
      },
    ]),
  };
}

// ================================
// STATE INTERFACE & DEFAULT STATE
// ================================

interface QuickPlanState {
  inputs: QuickPlanInputs;
  touched: TouchedState;
  errors: ErrorState;

  preferences: {
    dataStorage: 'localStorage' | 'none';
    showReferenceLines: boolean;
    simulationSeed: number;
    sidebarCollapsed: boolean;
  };

  actions: {
    // Basic input actions with validation and error reporting
    updateBasics: (field: keyof BasicsInputs, value: unknown) => UpdateResult;
    updateGrowthRates: (field: keyof GrowthRatesInputs, value: unknown) => UpdateResult;
    updateAllocation: (data: { [K in keyof AllocationInputs]: unknown }) => UpdateResult;
    updateGoals: (field: keyof GoalsInputs, value: unknown) => UpdateResult;
    updateGoalsWithoutTouched: (field: keyof GoalsInputs, value: unknown) => UpdateResult;
    updateMarketAssumptions: (field: keyof MarketAssumptionsInputs, value: unknown) => UpdateResult;
    updateRetirementFunding: (field: keyof RetirementFundingInputs, value: unknown) => UpdateResult;

    updateTimelines: (data: TimelineInputs) => UpdateResult;
    deleteTimeline: (id: string) => UpdateResult;

    updateIncomes: (data: IncomeInputs) => UpdateResult;
    deleteIncome: (id: string) => UpdateResult;

    updateExpenses: (data: ExpenseInputs) => UpdateResult;
    deleteExpense: (id: string) => UpdateResult;

    updateAccounts: (data: AccountInputs) => UpdateResult;
    deleteAccount: (id: string) => UpdateResult;

    updateContributionRules: (data: ContributionInputs) => UpdateResult;
    reorderContributionRules: (newOrder: string[]) => UpdateResult;
    deleteContributionRule: (id: string) => UpdateResult;

    updateBaseContributionRule: (field: keyof BaseContributionInputs, value: unknown) => UpdateResult;

    // Preferences actions
    updatePreferences: (field: keyof QuickPlanState['preferences'], value: unknown) => void;
    generateNewSeed: () => void;

    // Utility actions
    resetStore: () => void;
    resetSection: (section: keyof QuickPlanInputs) => void;
  };
}

export const defaultState: Omit<QuickPlanState, 'actions'> = {
  inputs: {
    basics: {
      currentAge: 28,
      annualIncome: 85000,
      annualExpenses: 50000,
      investedAssets: 75000,
    },
    growthRates: {
      incomeGrowthRate: 3, // Nominal % - "My salary increases by X% per year"
      expenseGrowthRate: 3, // Nominal % - "My spending increases by X% per year"
    },
    allocation: {
      stockAllocation: 70,
      bondAllocation: 25,
      cashAllocation: 5,
    },
    goals: {
      retirementExpenses: 50000, // Real $ - "What I'd spend in retirement (today's dollars)"
    },
    marketAssumptions: {
      stockReturn: 10, // Nominal % - matches market reporting
      bondReturn: 5, // Nominal %
      cashReturn: 3, // Nominal %
      inflationRate: 3, // The bridge between nominal and real
      simulationMode: 'fixedReturns',
    },
    retirementFunding: {
      safeWithdrawalRate: 4,
      retirementIncome: 0, // Real $ - "Social Security (today's dollars)"
      lifeExpectancy: 78,
      effectiveTaxRate: 0,
    },
    timelines: {},
    incomes: {},
    expenses: {},
    accounts: {},
    contributionRules: {},
    baseContributionRule: {
      type: 'save',
    },
  },
  touched: {
    basics: false,
    growthRates: false,
    allocation: false,
    goals: false,
    marketAssumptions: false,
    retirementFunding: false,
    timelines: false,
    incomes: false,
    expenses: false,
    accounts: false,
    contributionRules: false,
    baseContributionRule: false,
  },
  errors: {},
  preferences: {
    dataStorage: 'localStorage',
    showReferenceLines: true,
    simulationSeed: Math.floor(Math.random() * 1000),
    sidebarCollapsed: false,
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

/** Run cleanup on initialization */
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
          // Update actions with validation - using helper to reduce duplication
          updateBasics: createSimpleUpdateAction('basics', set, get),
          updateGrowthRates: createSimpleUpdateAction('growthRates', set, get),
          updateGoals: createSimpleUpdateAction('goals', set, get),
          updateGoalsWithoutTouched: createSimpleUpdateAction('goals', set, get, false),
          updateMarketAssumptions: createSimpleUpdateAction('marketAssumptions', set, get),
          updateRetirementFunding: createSimpleUpdateAction('retirementFunding', set, get),

          // Special case for allocation - uses validateSection instead of validateField
          updateAllocation: (data) => {
            const result = validateSection('allocation', data);

            set((state) => {
              state.touched.allocation = true;

              if (result.valid && result.data) {
                state.inputs.allocation = result.data;
                state.errors.allocation = {};
              } else {
                state.errors.allocation = {
                  stockAllocation: result.error,
                  bondAllocation: result.error,
                  cashAllocation: result.error,
                };
              }
            });

            return {
              success: result.valid,
              error: result.error,
            };
          },

          updateTimelines: (data: TimelineInputs) => {
            set((state) => {
              state.touched.timelines = true;
              state.inputs.timelines = { ...state.inputs.timelines, [data.id]: data };
            });

            return { success: true };
          },

          deleteTimeline: (id: string) => {
            set((state) => {
              state.touched.timelines = true;
              delete state.inputs.timelines[id];
            });

            return { success: true };
          },

          updateIncomes: (data: IncomeInputs) => {
            set((state) => {
              state.touched.incomes = true;
              state.inputs.incomes = { ...state.inputs.incomes, [data.id]: data };
            });

            return { success: true };
          },

          deleteIncome: (name) => {
            set((state) => {
              state.touched.incomes = true;
              delete state.inputs.incomes[name];
            });

            return { success: true };
          },

          updateAccounts: (data: AccountInputs) => {
            set((state) => {
              state.touched.accounts = true;
              state.inputs.accounts = { ...state.inputs.accounts, [data.id]: data };
            });

            return { success: true };
          },

          deleteAccount: (id: string) => {
            set((state) => {
              state.touched.accounts = true;
              delete state.inputs.accounts[id];
            });

            return { success: true };
          },

          updateExpenses: (data: ExpenseInputs) => {
            set((state) => {
              state.touched.expenses = true;
              state.inputs.expenses = { ...state.inputs.expenses, [data.id]: data };
            });

            return { success: true };
          },

          deleteExpense: (id: string) => {
            set((state) => {
              state.touched.expenses = true;
              delete state.inputs.expenses[id];
            });

            return { success: true };
          },

          updateContributionRules: (data: ContributionInputs) => {
            set((state) => {
              state.touched.contributionRules = true;
              state.inputs.contributionRules = { ...state.inputs.contributionRules, [data.id]: data };
            });

            return { success: true };
          },

          reorderContributionRules: (newOrder: string[]) => {
            set((state) => {
              newOrder.forEach((id, index) => {
                const contributionRule = state.inputs.contributionRules[id];
                if (contributionRule) {
                  contributionRule.rank = index + 1;
                }
              });
            });

            return { success: true };
          },

          deleteContributionRule: (id: string) => {
            set((state) => {
              state.touched.contributionRules = true;
              delete state.inputs.contributionRules[id];
            });

            return { success: true };
          },

          updateBaseContributionRule: createSimpleUpdateAction('baseContributionRule', set, get),

          /** Preferences actions */
          updatePreferences: (field, value) =>
            set((state) => {
              if (field === 'dataStorage') {
                state.preferences.dataStorage = value as 'localStorage' | 'none';
              } else if (field === 'showReferenceLines') {
                state.preferences.showReferenceLines = value as boolean;
              } else if (field === 'simulationSeed') {
                state.preferences.simulationSeed = value as number;
              } else if (field === 'sidebarCollapsed') {
                state.preferences.sidebarCollapsed = value as boolean;
              }
            }),

          generateNewSeed: () =>
            set((state) => {
              state.preferences.simulationSeed = Math.floor(Math.random() * 1000);
            }),

          /** Utility actions */
          resetStore: () =>
            set((state) => {
              state.inputs = { ...defaultState.inputs };
              state.touched = { ...defaultState.touched };
              state.errors = {};
            }),

          resetSection: (section) =>
            set((state) => {
              // NOTE: Rethink Object.assign approach if using deeply nested state in the future.
              Object.assign(state.inputs[section], defaultState.inputs[section]);
              state.touched[section] = false;
              if (state.errors[section]) delete state.errors[section];
            }),
        },
      })),
      {
        name: 'quick-plan-storage',
        version: 1,
        // Simple migration: just use defaults for any version change
        migrate: () => ({ ...defaultState }),
        // Only persist the inputs and preferences state, not the actions
        partialize: (state) => {
          const baseResult = { preferences: state.preferences };

          if (state.preferences.dataStorage === 'localStorage') {
            return {
              ...baseResult,
              inputs: state.inputs,
              touched: state.touched,
            };
          }

          return baseResult;
        },
      }
    ),
    {
      name: 'Quick Plan Store',
      anonymousActionType: 'quickPlan/action', // Default for any unnamed actions
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
export const useBasicsData = () => useQuickPlanStore((state) => state.inputs.basics);
export const useGrowthRatesData = () => useQuickPlanStore((state) => state.inputs.growthRates);
export const useAllocationData = () => useQuickPlanStore((state) => state.inputs.allocation);
export const useGoalsData = () => useQuickPlanStore((state) => state.inputs.goals);
export const useMarketAssumptionsData = () => useQuickPlanStore((state) => state.inputs.marketAssumptions);
export const useRetirementFundingData = () => useQuickPlanStore((state) => state.inputs.retirementFunding);

export const useTimelinesData = () => useQuickPlanStore((state) => state.inputs.timelines);
export const useFirstTimelineCurrentAge = () =>
  useQuickPlanStore((state) => {
    const timeline = Object.values(state.inputs.timelines)[0];
    if (!timeline) return null;

    return timeline.currentAge;
  });
export const useTimelineData = (id: string | null) => useQuickPlanStore((state) => (id !== null ? state.inputs.timelines[id] : null));

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
 * Individual field selectors for performance optimization
 * Use these for components that only need specific fields to minimize re-renders
 */
export const useCurrentAge = () => useQuickPlanStore((state) => state.inputs.basics.currentAge);
export const useAnnualIncome = () => useQuickPlanStore((state) => state.inputs.basics.annualIncome);
export const useAnnualExpenses = () => useQuickPlanStore((state) => state.inputs.basics.annualExpenses);
export const useInvestedAssets = () => useQuickPlanStore((state) => state.inputs.basics.investedAssets);
export const useLifeExpectancy = () => useQuickPlanStore((state) => state.inputs.retirementFunding.lifeExpectancy);

/**
 * Action selectors
 * These hooks provide access to update functions with built-in validation
 */
export const useUpdateBasics = () => useQuickPlanStore((state) => state.actions.updateBasics);
export const useUpdateGrowthRates = () => useQuickPlanStore((state) => state.actions.updateGrowthRates);
export const useUpdateAllocation = () => useQuickPlanStore((state) => state.actions.updateAllocation);
export const useUpdateGoals = () => useQuickPlanStore((state) => state.actions.updateGoals);
export const useUpdateGoalsWithoutTouched = () => useQuickPlanStore((state) => state.actions.updateGoalsWithoutTouched);
export const useUpdateMarketAssumptions = () => useQuickPlanStore((state) => state.actions.updateMarketAssumptions);
export const useUpdateRetirementFunding = () => useQuickPlanStore((state) => state.actions.updateRetirementFunding);
export const useUpdateTimelines = () => useQuickPlanStore((state) => state.actions.updateTimelines);
export const useDeleteTimeline = () => useQuickPlanStore((state) => state.actions.deleteTimeline);
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

/**
 * Preferences selectors
 * These hooks manage user preferences and settings
 */
export const usePreferencesData = () => useQuickPlanStore((state) => state.preferences);
export const useShowReferenceLinesPreference = () => useQuickPlanStore((state) => state.preferences.showReferenceLines);
export const useSimulationSeed = () => useQuickPlanStore((state) => state.preferences.simulationSeed);
export const useSidebarCollapsed = () => useQuickPlanStore((state) => state.preferences.sidebarCollapsed);
export const useUpdatePreferences = () => useQuickPlanStore((state) => state.actions.updatePreferences);
export const useGenerateNewSeed = () => useQuickPlanStore((state) => state.actions.generateNewSeed);

/**
 * Utility selectors
 * These hooks provide access to store management functions
 */
export const useResetStore = () => useQuickPlanStore((state) => state.actions.resetStore);
export const useResetSection = () => useQuickPlanStore((state) => state.actions.resetSection);

/**
 * Simulation & Analysis Hooks
 * These hooks provide access to simulation and analysis functions
 */
export const useFixedReturnsSimulation = () => {
  const inputs = useQuickPlanStore(useShallow((state) => state.inputs));

  return useMemo(() => {
    const engine = new FinancialSimulationEngine(inputs);
    const returnsProvider = new FixedReturnsProvider(inputs);
    const initialPortfolio = FinancialSimulationEngine.createDefaultInitialPortfolio(inputs);
    const initialPhase = FinancialSimulationEngine.createDefaultInitialPhase(initialPortfolio, inputs);

    return engine.runSimulation(returnsProvider, initialPortfolio, initialPhase);
  }, [inputs]);
};

export const useFixedReturnsSimulationV2 = (): SimulationResultV2 | null => {
  // TODO: Add memoization.
  const inputs = useQuickPlanStore((state) => state.inputs);

  return useMemo(() => {
    if (!Object.values(inputs.timelines).length) return null;

    const engine = new FinancialSimulationEngineV2(inputs);
    const returnsProvider = new FixedReturnsProvider(inputs);
    const timeline = Object.values(inputs.timelines)[0];

    return engine.runSimulation(returnsProvider, timeline);
  }, [inputs]);
};

export const useSingleMonteCarloSimulation = (seed: number | null) => {
  const inputs = useQuickPlanStore(useShallow((state) => state.inputs));

  return useMemo(() => {
    if (seed === null) return null;

    const engine = new MonteCarloSimulationEngine(inputs, seed);
    return engine.runSingleSimulation(seed);
  }, [inputs, seed]);
};

export const useSingleHistoricalBacktestSimulation = (seed: number | null) => {
  const inputs = useQuickPlanStore(useShallow((state) => state.inputs));

  return useMemo(() => {
    if (seed === null) return null;

    const engine = new LcgHistoricalBacktestSimulationEngine(inputs, seed);
    return engine.runSingleSimulation(seed);
  }, [inputs, seed]);
};

export const useMonteCarloSimulation = () => {
  const inputs = useQuickPlanStore(useShallow((state) => state.inputs));
  const simulationSeed = useSimulationSeed();

  return useMemo(() => {
    const engine = new MonteCarloSimulationEngine(inputs, simulationSeed);
    return engine.runMonteCarloSimulation(100);
  }, [inputs, simulationSeed]);
};

export const useMonteCarloSimulationWithWorker = () => {
  const inputs = useQuickPlanStore(useShallow((state) => state.inputs));
  const simulationSeed = useSimulationSeed();

  return useSWR(
    ['monteCarloSim', inputs, simulationSeed],
    async () => {
      const worker = getSimulationWorker();
      const dto = await worker.runMonteCarloSimulation(inputs, simulationSeed, 1000);

      return reconstructSimulationResult(dto);
    },
    { revalidateOnFocus: false }
  );
};

export const useMonteCarloAnalysisWithWorker = () => {
  const inputs = useQuickPlanStore(useShallow((state) => state.inputs));
  const simulationSeed = useSimulationSeed();

  return useSWR(
    ['monteCarloSimAndAnalyze', inputs, simulationSeed],
    async () => {
      const worker = getSimulationWorker();
      return await worker.analyzeMonteCarloSimulation(inputs, simulationSeed, 1000);
    },
    { revalidateOnFocus: false }
  );
};

export const useHistoricalBacktestSimulation = () => {
  const inputs = useQuickPlanStore(useShallow((state) => state.inputs));
  const simulationSeed = useSimulationSeed();

  return useMemo(() => {
    const engine = new LcgHistoricalBacktestSimulationEngine(inputs, simulationSeed);
    return engine.runLcgHistoricalBacktest(100);
  }, [inputs, simulationSeed]);
};

export const useHistoricalBacktestSimulationWithWorker = () => {
  const inputs = useQuickPlanStore(useShallow((state) => state.inputs));
  const simulationSeed = useSimulationSeed();

  return useSWR(
    ['historicalBacktestSim', inputs, simulationSeed],
    async () => {
      const worker = getSimulationWorker();
      const dto = await worker.runHistoricalBacktestSimulation(inputs, simulationSeed, 1000);

      return reconstructSimulationResult(dto);
    },
    { revalidateOnFocus: false }
  );
};

export const useHistoricalBacktestAnalysisWithWorker = () => {
  const inputs = useQuickPlanStore(useShallow((state) => state.inputs));
  const simulationSeed = useSimulationSeed();

  return useSWR(
    ['historicalBacktestSimAndAnalyze', inputs, simulationSeed],
    async () => {
      const worker = getSimulationWorker();
      return await worker.analyzeHistoricalBacktestSimulation(inputs, simulationSeed, 1000);
    },
    { revalidateOnFocus: false }
  );
};

export interface FixedReturnsAnalysis {
  success: boolean;
  progressToFIRE: number;
  yearsToFIRE: number | null;
  fireAge: number | null;
  requiredPortfolio: number;
  finalPortfolio: number;
  performance: number | null;
}

export const useFixedReturnsAnalysis = (simulation: SimulationResult) => {
  const inputs = useQuickPlanStore(useShallow((state) => state.inputs));

  return useMemo(() => {
    let yearsToFIRE: number | null = null;
    let fireAge: number | null = null;
    for (const phase of simulation.phasesMetadata) {
      if (phase[1].getName() === 'Retirement') {
        yearsToFIRE = phase[0];
        fireAge = inputs.basics.currentAge! + yearsToFIRE;
        break;
      }
    }

    const requiredPortfolio = WithdrawalStrategy.getConstantDollarRequiredPortfolio(inputs);
    const progressToFIRE = Math.min(inputs.basics.investedAssets! / requiredPortfolio, 1);

    const finalPortfolioInstance = simulation.data[simulation.data.length - 1][1];

    const finalPortfolio = finalPortfolioInstance.getTotalValue();
    const performance = finalPortfolioInstance.getPerformance();
    const success = !finalPortfolioInstance.getIsDepleted() && yearsToFIRE !== null;

    return { success, progressToFIRE, yearsToFIRE, fireAge, requiredPortfolio, finalPortfolio, performance };
  }, [inputs, simulation]);
};

export interface StochasticAnalysis {
  successRate: number;
  progressToFIRE: number;
  p10YearsToFIRE: number | null;
  p10FireAge: number | null;
  p50YearsToFIRE: number | null;
  p50FireAge: number | null;
  p90YearsToFIRE: number | null;
  p90FireAge: number | null;
  requiredPortfolio: number;
  finalPortfolio: number;
}

export const useStochasticAnalysis = (analysis: AggregateSimulationStats) => {
  const inputs = useQuickPlanStore(useShallow((state) => state.inputs));

  return useMemo(() => {
    const successRate = analysis.successRate;
    const requiredPortfolio = WithdrawalStrategy.getConstantDollarRequiredPortfolio(inputs);
    const progressToFIRE = Math.min(inputs.basics.investedAssets! / requiredPortfolio, 1);
    const finalPortfolio = analysis.yearlyProgression[analysis.yearlyProgression.length - 1].percentiles.p50;

    let p10YearsToFIRE: number | null = null;
    let p10FireAge: number | null = null;

    let p50YearsToFIRE: number | null = null;
    let p50FireAge: number | null = null;

    let p90YearsToFIRE: number | null = null;
    let p90FireAge: number | null = null;

    for (const phase of analysis.phaseStats ?? []) {
      if (phase.phaseName === 'Accumulation') {
        p10YearsToFIRE = phase.durationPercentiles.p10;
        p10FireAge = inputs.basics.currentAge! + p10YearsToFIRE;

        p50YearsToFIRE = phase.durationPercentiles.p50;
        p50FireAge = inputs.basics.currentAge! + p50YearsToFIRE;

        p90YearsToFIRE = phase.durationPercentiles.p90;
        p90FireAge = inputs.basics.currentAge! + p90YearsToFIRE;
        break;
      }
    }

    return {
      successRate,
      progressToFIRE,
      p10YearsToFIRE,
      p10FireAge,
      p50YearsToFIRE,
      p50FireAge,
      p90YearsToFIRE,
      p90FireAge,
      requiredPortfolio,
      finalPortfolio,
    };
  }, [inputs, analysis]);
};

/**
 * Single Simulation Chart Hooks
 * These hooks provide access to single simulation chart data
 */
export const useSingleSimulationPortfolioAreaChartData = (simulation: SimulationResultV2) => {
  const currentAge = useFirstTimelineCurrentAge()!;

  return useMemo(() => {
    return simulation.data.map((data) => {
      const startDateYear = new Date().getFullYear();
      const currDateYear = new Date(data.date).getFullYear();

      const portfolio = data.portfolio;
      const totalValue = portfolio.totalValue;

      const assetAllocation = portfolio.assetAllocation ?? { stocks: 0, bonds: 0, cash: 0 };
      const stocksAllocation = assetAllocation.stocks;
      const bondsAllocation = assetAllocation.bonds;
      const cashAllocation = assetAllocation.cash;

      return {
        age: currDateYear - startDateYear + currentAge,
        stocks: totalValue * stocksAllocation,
        bonds: totalValue * bondsAllocation,
        cash: totalValue * cashAllocation,
        portfolioValue: totalValue,
      };
    });
  }, [currentAge, simulation]);
};

/**
 * Fixed Returns Chart Hooks
 * These hooks provide access to fixed returns simulation chart data
 */
export const useFixedReturnsChartData = (simulation: SimulationResult) => {
  const currentAge = useCurrentAge()!;

  return useMemo(() => {
    return simulation.data.map(([timeInYears, portfolio]) => ({
      age: timeInYears + currentAge,
      stocks: portfolio.getAssetValue('stocks'),
      bonds: portfolio.getAssetValue('bonds'),
      cash: portfolio.getAssetValue('cash'),
      portfolioValue: portfolio.getTotalValue(),
    }));
  }, [currentAge, simulation]);
};

export const useFixedReturnsCashFlowChartData = (simulation: SimulationResult) => {
  const currentAge = useCurrentAge()!;

  return useMemo(() => {
    return simulation.cashFlowsMetadata.flatMap(([timeInYears, cashFlows]) =>
      cashFlows.map(({ name, amount }) => ({ age: timeInYears + currentAge, name, amount }))
    );
  }, [currentAge, simulation]);
};

/**
 * Stochastic Chart Hooks
 * These hooks provide access to stochastic simulation chart data
 */
export const useStochasticPortfolioAreaChartData = (analysis: AggregateSimulationStats) => {
  const currentAge = useCurrentAge()!;

  return useMemo(() => {
    return analysis.yearlyProgression.map((data) => ({
      age: data.year + currentAge,
      p25: data.percentiles.p25,
      p50: data.percentiles.p50,
      p75: data.percentiles.p75,
    }));
  }, [currentAge, analysis]);
};

export const useStochasticPortfolioPercentilesChartData = (analysis: AggregateSimulationStats) => {
  const currentAge = useCurrentAge()!;

  return useMemo(() => {
    return analysis.yearlyProgression.flatMap((data) => [
      { age: data.year + currentAge, name: 'P10', amount: data.percentiles.p10 },
      { age: data.year + currentAge, name: 'P25', amount: data.percentiles.p25 },
      { age: data.year + currentAge, name: 'P50', amount: data.percentiles.p50 },
      { age: data.year + currentAge, name: 'P75', amount: data.percentiles.p75 },
      { age: data.year + currentAge, name: 'P90', amount: data.percentiles.p90 },
    ]);
  }, [currentAge, analysis]);
};

export const useStochasticPortfolioDistributionChartData = (analysis: AggregateSimulationStats) => {
  const currentAge = useCurrentAge()!;

  return useMemo(() => {
    return analysis.yearlyProgression.flatMap((data) => [
      { age: data.year + currentAge, name: '<P10', amount: data.distribution.belowP10 },
      { age: data.year + currentAge, name: 'P10—P25', amount: data.distribution.p10toP25 },
      { age: data.year + currentAge, name: 'P25—P50', amount: data.distribution.p25toP50 },
      { age: data.year + currentAge, name: 'P50—P75', amount: data.distribution.p50toP75 },
      { age: data.year + currentAge, name: 'P75—P90', amount: data.distribution.p75toP90 },
      { age: data.year + currentAge, name: '>P90', amount: data.distribution.aboveP90 },
    ]);
  }, [currentAge, analysis]);
};

export const useStochasticCashFlowChartData = (analysis: AggregateSimulationStats) => {
  const currentAge = useCurrentAge()!;

  return useMemo(() => {
    return analysis.yearlyProgression.flatMap((data) =>
      Object.entries(data.cashFlows.byName)
        .filter(([, stats]) => stats !== null)
        .map(([name, stats]) => ({
          age: data.year + currentAge,
          name,
          amount: stats!.mean,
        }))
    );
  }, [currentAge, analysis]);
};

export const useStochasticPhasePercentAreaChartData = (analysis: AggregateSimulationStats) => {
  const currentAge = useCurrentAge()!;

  return useMemo(() => {
    return analysis.yearlyProgression.map((data) => ({
      age: data.year + currentAge,
      percentAccumulation: data.phasePercentages.accumulation,
      percentRetirement: data.phasePercentages.retirement,
      percentBankrupt: data.phasePercentages.bankrupt,
    }));
  }, [currentAge, analysis]);
};

export const useStochasticReturnsChartData = (analysis: AggregateSimulationStats) => {
  const currentAge = useCurrentAge()!;

  return useMemo(() => {
    return analysis.yearlyProgression.flatMap((data) => {
      const results = [];

      const stocksAmountMean = data.returns.amounts.stocks?.mean;
      if (stocksAmountMean) {
        results.push({
          age: data.year + currentAge,
          name: 'Stocks',
          rate: data.returns.rates.stocks?.mean ?? null,
          amount: stocksAmountMean,
        });
      }

      const bondsAmountMean = data.returns.amounts.bonds?.mean;
      if (bondsAmountMean) {
        results.push({
          age: data.year + currentAge,
          name: 'Bonds',
          rate: data.returns.rates.bonds?.mean ?? null,
          amount: bondsAmountMean,
        });
      }

      const cashAmountMean = data.returns.amounts.cash?.mean;
      if (cashAmountMean) {
        results.push({
          age: data.year + currentAge,
          name: 'Cash',
          rate: data.returns.rates.cash?.mean ?? null,
          amount: cashAmountMean,
        });
      }

      results.push({
        age: data.year + currentAge,
        name: 'Inflation',
        rate: data.returns.inflation?.mean ? data.returns.inflation.mean / 100 : null,
        amount: null,
      });

      return results;
    });
  }, [currentAge, analysis]);
};

export const useStochasticWithdrawalsChartData = (analysis: AggregateSimulationStats) => {
  const currentAge = useCurrentAge()!;

  return useMemo(() => {
    return analysis.yearlyProgression.map((data) => ({
      age: data.year + currentAge,
      name: 'Withdrawals',
      rate: data.withdrawals.percentage?.mean ?? null,
      amount: data.withdrawals.amount?.mean ?? null,
    }));
  }, [currentAge, analysis]);
};

/**
 * Fixed Returns Table Hooks
 * These hooks provide access to fixed returns simulation table data
 */
export const useFixedReturnsTableData = (simulation: SimulationResult): SimulationTableRow[] => {
  const currentAge = useCurrentAge()!;

  return useMemo(() => {
    const extractor = new SimulationTableDataExtractor();
    return extractor.extractSingleSimulationTableData(simulation, currentAge);
  }, [currentAge, simulation]);
};

/**
 * Stochastic Table Hooks
 * These hooks provide access to stochastic simulation table data
 */
export const useMonteCarloTableDataWithWorker = () => {
  const inputs = useQuickPlanStore(useShallow((state) => state.inputs));
  const simulationSeed = useSimulationSeed();

  return useSWR(
    ['monteCarloTableData', inputs, simulationSeed],
    async () => {
      const worker = getSimulationWorker();
      return await worker.generateMonteCarloTableData(inputs, simulationSeed, 1000);
    },
    { revalidateOnFocus: false }
  );
};

export const useHistoricalBacktestTableDataWithWorker = () => {
  const inputs = useQuickPlanStore(useShallow((state) => state.inputs));
  const simulationSeed = useSimulationSeed();

  return useSWR(
    ['historicalBacktestTableData', inputs, simulationSeed],
    async () => {
      const worker = getSimulationWorker();
      return await worker.generateHistoricalBacktestTableData(inputs, simulationSeed, 1000);
    },
    { revalidateOnFocus: false }
  );
};

/**
 * Hook to convert a single SimulationResult to SimulationTableRow[] format
 * Used for drill-down functionality in Monte Carlo and Historical Backtest tables
 */
export const useStochasticDrillDownTableData = (simulation: SimulationResult | null): SimulationTableRow[] => {
  const currentAge = useCurrentAge()!;

  return useMemo(() => {
    const extractor = new SimulationTableDataExtractor();
    return extractor.extractSingleSimulationTableData(simulation, currentAge);
  }, [currentAge, simulation]);
};

export const useStochasticYearlyResultsTableData = (analysis: AggregateSimulationStats): YearlyAggregateTableRow[] => {
  const currentAge = useCurrentAge()!;

  return useMemo(() => {
    const extractor = new SimulationTableDataExtractor();
    return extractor.extractYearlyResultsTableData(analysis, currentAge);
  }, [analysis, currentAge]);
};

/**
 * Asset Allocation Calculations
 * These hooks provide computed dollar amounts for each asset class based on allocation percentages
 */
export const useStocksDollarAmount = () =>
  useQuickPlanStore((state) => {
    const investedAssets = state.inputs.basics.investedAssets;
    if (investedAssets === null) return 0;

    const stockAllocation = state.inputs.allocation.stockAllocation;
    return (investedAssets * stockAllocation) / 100;
  });

export const useBondsDollarAmount = () =>
  useQuickPlanStore((state) => {
    const investedAssets = state.inputs.basics.investedAssets;
    if (investedAssets === null) return 0;

    const bondAllocation = state.inputs.allocation.bondAllocation;
    return (investedAssets * bondAllocation) / 100;
  });

export const useCashDollarAmount = () =>
  useQuickPlanStore((state) => {
    const investedAssets = state.inputs.basics.investedAssets;
    if (investedAssets === null) return 0;

    const cashAllocation = state.inputs.allocation.cashAllocation;
    return (investedAssets * cashAllocation) / 100;
  });

/**
 * Real Return Rate Calculations
 * These hooks calculate real (inflation-adjusted) returns using the Fisher equation
 */
export const useStocksRealReturn = () =>
  useQuickPlanStore((state) => {
    const nominalReturn = state.inputs.marketAssumptions.stockReturn;
    const inflationRate = state.inputs.marketAssumptions.inflationRate;
    const realReturn = (1 + nominalReturn / 100) / (1 + inflationRate / 100) - 1;
    return realReturn * 100; // Convert back to percentage
  });

export const useBondsRealReturn = () =>
  useQuickPlanStore((state) => {
    const nominalReturn = state.inputs.marketAssumptions.bondReturn;
    const inflationRate = state.inputs.marketAssumptions.inflationRate;
    const realReturn = (1 + nominalReturn / 100) / (1 + inflationRate / 100) - 1;
    return realReturn * 100; // Convert back to percentage
  });

export const useCashRealReturn = () =>
  useQuickPlanStore((state) => {
    const nominalReturn = state.inputs.marketAssumptions.cashReturn;
    const inflationRate = state.inputs.marketAssumptions.inflationRate;
    const realReturn = (1 + nominalReturn / 100) / (1 + inflationRate / 100) - 1;
    return realReturn * 100; // Convert back to percentage
  });

export const useIncomeRealGrowthRate = () =>
  useQuickPlanStore((state) => {
    const nominalGrowthRate = state.inputs.growthRates.incomeGrowthRate;
    const inflationRate = state.inputs.marketAssumptions.inflationRate;
    const realGrowthRate = (1 + nominalGrowthRate / 100) / (1 + inflationRate / 100) - 1;
    return realGrowthRate * 100; // Convert back to percentage
  });

export const useExpenseRealGrowthRate = () =>
  useQuickPlanStore((state) => {
    const nominalGrowthRate = state.inputs.growthRates.expenseGrowthRate;
    const inflationRate = state.inputs.marketAssumptions.inflationRate;
    const realGrowthRate = (1 + nominalGrowthRate / 100) / (1 + inflationRate / 100) - 1;
    return realGrowthRate * 100; // Convert back to percentage
  });

/**
 * Validation State Selectors
 * These hooks check if sections or the entire form have valid data for calculations
 */
export const useBasicsValidation = () =>
  useQuickPlanStore(
    (state) =>
      state.inputs.basics.currentAge !== null &&
      state.inputs.basics.annualIncome !== null &&
      state.inputs.basics.annualExpenses !== null &&
      state.inputs.basics.investedAssets !== null
  );
export const useGoalsValidation = () => useQuickPlanStore((state) => state.inputs.goals.retirementExpenses !== null);
export const useIsCalculationReady = () =>
  useQuickPlanStore(
    (state) =>
      state.inputs.basics.currentAge !== null &&
      state.inputs.basics.annualIncome !== null &&
      state.inputs.basics.annualExpenses !== null &&
      state.inputs.basics.investedAssets !== null &&
      state.inputs.goals.retirementExpenses !== null
  );

/**
 * Touched State Selectors
 * These hooks provide access to form interaction state for UI feedback
 */
export const useBasicsTouched = () => useQuickPlanStore((state) => state.touched.basics);
export const useGrowthRatesTouched = () => useQuickPlanStore((state) => state.touched.growthRates);
export const useAllocationTouched = () => useQuickPlanStore((state) => state.touched.allocation);
export const useGoalsTouched = () => useQuickPlanStore((state) => state.touched.goals);
export const useMarketAssumptionsTouched = () => useQuickPlanStore((state) => state.touched.marketAssumptions);
export const useRetirementFundingTouched = () => useQuickPlanStore((state) => state.touched.retirementFunding);

/**
 * Error State Selectors
 * These hooks provide access to validation error state for form feedback
 */
const useSectionHasErrors = (section: keyof QuickPlanInputs) =>
  useQuickPlanStore((state) => Object.keys(state.errors[section] || {}).length > 0);

export const useBasicsHasErrors = () => useSectionHasErrors('basics');
export const useGrowthRatesHasErrors = () => useSectionHasErrors('growthRates');
export const useAllocationHasErrors = () => useSectionHasErrors('allocation');
export const useGoalsHasErrors = () => useSectionHasErrors('goals');
export const useMarketAssumptionsHasErrors = () => useSectionHasErrors('marketAssumptions');
export const useRetirementFundingHasErrors = () => useSectionHasErrors('retirementFunding');
