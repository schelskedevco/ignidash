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
import { calculateYearsToFIRE, calculateFIREAge, getFIREAnalysis } from '@/lib/calc/analysis/calculator';
import { getFIREChartData } from '@/lib/calc/analysis/charts';
import { FinancialSimulationEngine } from '@/lib/calc/simulation-engine';
import { FixedReturnsProvider } from '@/lib/calc/fixed-returns-provider';

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
        version: 2,
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
 * Fixed Returns Simulation Hook
 * Central hook that runs the simulation engine with fixed returns provider
 * All FIRE calculations derive from this simulation data
 */
export const useFixedReturnsSimulation = () => {
  const inputs = useQuickPlanStore((state) => state.inputs);
  const isReady = useIsCalculationReady();

  return useMemo(() => {
    if (!isReady) return null;

    const engine = new FinancialSimulationEngine(inputs);
    const returnsProvider = new FixedReturnsProvider(inputs);
    const initialPortfolio = FinancialSimulationEngine.createDefaultInitialPortfolio(inputs);
    const initialPhase = FinancialSimulationEngine.createDefaultInitialPhase(initialPortfolio, inputs);

    return engine.runSimulation(returnsProvider, initialPortfolio, initialPhase);
  }, [inputs, isReady]);
};

/**
 * FIRE Analysis Hook
 * Provides computed values for Financial Independence, Retire Early analysis
 */
export const useFixedReturnsAnalysis = () => {
  const inputs = useQuickPlanStore((state) => state.inputs);
  const simulation = useFixedReturnsSimulation();

  return useMemo(() => {
    if (!simulation) return null;

    let yearsToFIRE = null;
    let fireAge = null;
    for (const phase of simulation.phasesMetadata) {
      if (phase[1].getName() === 'Retirement Phase') {
        yearsToFIRE = phase[0];
        fireAge = inputs.basics.currentAge! + yearsToFIRE;
      }
    }

    let requiredPortfolio = null;
    if (yearsToFIRE !== null) {
      requiredPortfolio = simulation.data[yearsToFIRE][1].getTotalValue();
    }

    return {
      yearsToFIRE,
      fireAge,
      requiredPortfolio,
    };
  }, [inputs, simulation]);
};

/**
 * FIRE Calculations
 * These hooks provide computed values for Financial Independence, Retire Early analysis
 */
export const useYearsToFIRE = () => useQuickPlanStore((state) => calculateYearsToFIRE(state.inputs));
export const useFIREAge = () => useQuickPlanStore((state) => calculateFIREAge(state.inputs));
export const useFIREAnalysis = () => useQuickPlanStore(useShallow((state) => getFIREAnalysis(state.inputs)));
export const useFIREChartData = () => {
  const inputs = useQuickPlanStore((state) => state.inputs);

  const fireAge = useFIREAge();
  // TODO: Rethink rounding logic. See results-chart.tsx's ReferenceLine for context.
  // Rounding here to ensure consistent chart data, but may need to be revisited.
  const roundedFireAge = fireAge !== null ? Math.round(fireAge) : null;

  return useMemo(() => getFIREChartData(inputs, roundedFireAge), [inputs, roundedFireAge]);
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
