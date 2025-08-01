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
// import { useShallow } from 'zustand/react/shallow';

import {
  type QuickPlanInputs,
  type BasicsInputs,
  type GrowthRatesInputs,
  type AllocationInputs,
  type GoalsInputs,
  type MarketAssumptionsInputs,
  type RetirementFundingInputs,
  type FlexiblePathsInputs,
  validateField,
  validateSection,
} from '@/lib/schemas/quick-plan-schema';
import { FinancialSimulationEngine, MonteCarloSimulationEngine, LcgHistoricalBacktestSimulationEngine } from '@/lib/calc/simulation-engine';
import { FixedReturnsProvider } from '@/lib/calc/fixed-returns-provider';
import { SimulationAnalyzer } from '@/lib/calc/simulation-analyzer';
import WithdrawalStrategy from '@/lib/calc/withdrawal-strategy';

// ================================
// TYPES & HELPERS
// ================================

type UpdateResult = {
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
    const result = validateField(section, field, value, get().inputs[section]);

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

// ================================
// STATE INTERFACE & DEFAULT STATE
// ================================

interface QuickPlanState {
  inputs: QuickPlanInputs;
  touched: TouchedState;
  errors: ErrorState;

  preferences: {
    displayFormat: 'today' | 'future';
    dataStorage: 'localStorage' | 'none';
  };

  actions: {
    // Basic input actions with validation and error reporting
    updateBasics: (field: keyof BasicsInputs, value: unknown) => UpdateResult;
    updateGrowthRates: (field: keyof GrowthRatesInputs, value: unknown) => UpdateResult;
    updateAllocation: (data: {
      [K in keyof AllocationInputs]: unknown;
    }) => UpdateResult;
    updateGoals: (field: keyof GoalsInputs, value: unknown) => UpdateResult;
    updateGoalsWithoutTouched: (field: keyof GoalsInputs, value: unknown) => UpdateResult;
    updateMarketAssumptions: (field: keyof MarketAssumptionsInputs, value: unknown) => UpdateResult;
    updateRetirementFunding: (field: keyof RetirementFundingInputs, value: unknown) => UpdateResult;
    updateFlexiblePaths: (field: keyof FlexiblePathsInputs, value: unknown) => UpdateResult;

    // Preferences actions
    updatePreferences: (field: keyof QuickPlanState['preferences'], value: string) => void;

    // Utility actions
    resetStore: () => void;
    resetSection: (section: keyof QuickPlanInputs) => void;
  };
}

export const defaultState: Omit<QuickPlanState, 'actions'> = {
  inputs: {
    basics: {
      currentAge: null,
      annualIncome: null,
      annualExpenses: null,
      investedAssets: null,
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
      retirementExpenses: null, // Real $ - "What I'd spend in retirement (today's dollars)"
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
    flexiblePaths: {
      targetRetirementAge: null,
      partTimeIncome: null, // Real $ - "Part-time income (today's dollars)"
    },
  },
  touched: {
    basics: false,
    growthRates: false,
    allocation: false,
    goals: false,
    marketAssumptions: false,
    retirementFunding: false,
    flexiblePaths: false,
  },
  errors: {},
  preferences: {
    displayFormat: 'today',
    dataStorage: 'localStorage',
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
          updateFlexiblePaths: createSimpleUpdateAction('flexiblePaths', set, get),

          // Special case for allocation - uses validateSection instead of validateField
          updateAllocation: (data) => {
            const result = validateSection('allocation', data);

            set((state) => {
              state.touched.allocation = true;

              if (result.valid && result.data) {
                state.inputs.allocation = result.data!;
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

          /** Preferences actions */
          updatePreferences: (field, value) =>
            set((state) => {
              if (field === 'displayFormat') {
                state.preferences.displayFormat = value as 'today' | 'future';
              } else if (field === 'dataStorage') {
                state.preferences.dataStorage = value as 'localStorage' | 'none';
              }
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
        version: 3,
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
export const useFlexiblePathsData = () => useQuickPlanStore((state) => state.inputs.flexiblePaths);

/**
 * Individual field selectors for performance optimization
 * Use these for components that only need specific fields to minimize re-renders
 */
export const useCurrentAge = () => useQuickPlanStore((state) => state.inputs.basics.currentAge);
export const useAnnualIncome = () => useQuickPlanStore((state) => state.inputs.basics.annualIncome);
export const useAnnualExpenses = () => useQuickPlanStore((state) => state.inputs.basics.annualExpenses);
export const useInvestedAssets = () => useQuickPlanStore((state) => state.inputs.basics.investedAssets);

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
export const useUpdateFlexiblePaths = () => useQuickPlanStore((state) => state.actions.updateFlexiblePaths);

/**
 * Preferences selectors
 * These hooks manage user preferences and settings
 */
export const usePreferencesData = () => useQuickPlanStore((state) => state.preferences);
export const useUpdatePreferences = () => useQuickPlanStore((state) => state.actions.updatePreferences);

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
  const inputs = useQuickPlanStore((state) => state.inputs);

  return useMemo(() => {
    const engine = new FinancialSimulationEngine(inputs);
    const returnsProvider = new FixedReturnsProvider(inputs);
    const initialPortfolio = FinancialSimulationEngine.createDefaultInitialPortfolio(inputs);
    const initialPhase = FinancialSimulationEngine.createDefaultInitialPhase(initialPortfolio, inputs);

    return engine.runSimulation(returnsProvider, initialPortfolio, initialPhase);
  }, [inputs]);
};

export const useMonteCarloSimulation = () => {
  const inputs = useQuickPlanStore((state) => state.inputs);

  return useMemo(() => {
    const baseSeed = Math.floor(Math.random() * 1000);
    const engine = new MonteCarloSimulationEngine(inputs, baseSeed);
    return engine.runMonteCarloSimulation(100);
  }, [inputs]);
};

export const useHistoricalBacktestSimulation = () => {
  const inputs = useQuickPlanStore((state) => state.inputs);

  return useMemo(() => {
    const baseSeed = Math.floor(Math.random() * 1000);
    const engine = new LcgHistoricalBacktestSimulationEngine(inputs, baseSeed);
    return engine.runLcgHistoricalBacktest(100);
  }, [inputs]);
};

export interface FixedReturnsAnalysis {
  yearsToFIRE: number | null;
  fireAge: number | null;
  requiredPortfolio: number;
}

export const useFixedReturnsAnalysis = () => {
  const inputs = useQuickPlanStore((state) => state.inputs);
  const simulation = useFixedReturnsSimulation();

  return useMemo(() => {
    let yearsToFIRE: number | null = null;
    let fireAge: number | null = null;
    for (const phase of simulation.phasesMetadata) {
      if (phase[1].getName() === 'Retirement Phase') {
        yearsToFIRE = phase[0];
        fireAge = inputs.basics.currentAge! + yearsToFIRE;
        break;
      }
    }

    return {
      yearsToFIRE,
      fireAge,
      requiredPortfolio: WithdrawalStrategy.getConstantDollarRequiredPortfolio(inputs),
    };
  }, [inputs, simulation]);
};

export interface StochasticAnalysis {
  successRate: number;
  p10YearsToFIRE: number | null;
  p10FireAge: number | null;
  p50YearsToFIRE: number | null;
  p50FireAge: number | null;
  p90YearsToFIRE: number | null;
  p90FireAge: number | null;
  requiredPortfolio: number;
}

export const useMonteCarloAnalysis = () => {
  const inputs = useQuickPlanStore((state) => state.inputs);
  const simulation = useMonteCarloSimulation();

  return useMemo(() => {
    const analyzer = new SimulationAnalyzer();
    const simulationData = simulation.simulations.map(([, result]) => result);

    const analysis = analyzer.analyzeSimulations(simulationData);
    if (!analysis) return null;

    const successRate = analysis.successRate;
    const requiredPortfolio = WithdrawalStrategy.getConstantDollarRequiredPortfolio(inputs);

    let p10YearsToFIRE: number | null = null;
    let p10FireAge: number | null = null;

    let p50YearsToFIRE: number | null = null;
    let p50FireAge: number | null = null;

    let p90YearsToFIRE: number | null = null;
    let p90FireAge: number | null = null;

    for (const phase of analysis.phaseStats ?? []) {
      if (phase.phaseName === 'Accumulation Phase') {
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
      p10YearsToFIRE,
      p10FireAge,
      p50YearsToFIRE,
      p50FireAge,
      p90YearsToFIRE,
      p90FireAge,
      requiredPortfolio,
    };
  }, [inputs, simulation]);
};

export const useHistoricalBacktestAnalysis = () => {
  const inputs = useQuickPlanStore((state) => state.inputs);
  const simulation = useHistoricalBacktestSimulation();

  return useMemo(() => {
    const analyzer = new SimulationAnalyzer();
    const simulationData = simulation.simulations.map(([, result]) => result);

    const analysis = analyzer.analyzeSimulations(simulationData);
    if (!analysis) return null;

    const successRate = analysis.successRate;
    const requiredPortfolio = WithdrawalStrategy.getConstantDollarRequiredPortfolio(inputs);

    let p10YearsToFIRE: number | null = null;
    let p10FireAge: number | null = null;

    let p50YearsToFIRE: number | null = null;
    let p50FireAge: number | null = null;

    let p90YearsToFIRE: number | null = null;
    let p90FireAge: number | null = null;

    for (const phase of analysis.phaseStats ?? []) {
      if (phase.phaseName === 'Accumulation Phase') {
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
      p10YearsToFIRE,
      p10FireAge,
      p50YearsToFIRE,
      p50FireAge,
      p90YearsToFIRE,
      p90FireAge,
      requiredPortfolio,
    };
  }, [inputs, simulation]);
};

export const useFixedReturnsChartData = () => {
  const currentAge = useCurrentAge()!;
  const simulation = useFixedReturnsSimulation();

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

export const useMonteCarloChartData = () => {
  const currentAge = useCurrentAge()!;
  const simulation = useMonteCarloSimulation();

  return useMemo(() => {
    const analyzer = new SimulationAnalyzer();
    const simulationData = simulation.simulations.map(([, result]) => result);

    const analysis = analyzer.analyzeSimulations(simulationData);
    if (!analysis) return [];

    return analysis.yearlyProgression.map((data) => ({
      age: data.year + currentAge,
      p10: data.percentiles.p10,
      p50: data.percentiles.p50,
      p90: data.percentiles.p90,
    }));
  }, [currentAge, simulation]);
};

export const useHistoricalBacktestChartData = () => {
  const currentAge = useCurrentAge()!;
  const simulation = useHistoricalBacktestSimulation();

  return useMemo(() => {
    const analyzer = new SimulationAnalyzer();
    const simulationData = simulation.simulations.map(([, result]) => result);

    const analysis = analyzer.analyzeSimulations(simulationData);
    if (!analysis) return [];

    return analysis.yearlyProgression.map((data) => ({
      age: data.year + currentAge,
      p10: data.percentiles.p10,
      p50: data.percentiles.p50,
      p90: data.percentiles.p90,
    }));
  }, [currentAge, simulation]);
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
export const useFlexiblePathsTouched = () => useQuickPlanStore((state) => state.touched.flexiblePaths);

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
export const useFlexiblePathsHasErrors = () => useSectionHasErrors('flexiblePaths');
