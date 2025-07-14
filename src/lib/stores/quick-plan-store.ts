import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
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
} from "../schemas/quick-plan-schema";

// Update result type
type UpdateResult = {
  success: boolean;
  error?: string;
};

// Store state interface
interface QuickPlanState {
  inputs: QuickPlanInputs;

  preferences: {
    displayFormat: "today" | "future";
    dataStorage: "localStorage" | "none";
  };

  actions: {
    // Basic input actions with validation and error reporting
    updateBasics: (field: keyof BasicsInputs, value: unknown) => UpdateResult;
    updateGrowthRates: (
      field: keyof GrowthRatesInputs,
      value: unknown
    ) => UpdateResult;
    updateAllocation: (data: {
      [K in keyof AllocationInputs]: unknown;
    }) => UpdateResult;
    updateGoals: (field: keyof GoalsInputs, value: unknown) => UpdateResult;
    updateMarketAssumptions: (
      field: keyof MarketAssumptionsInputs,
      value: unknown
    ) => UpdateResult;
    updateRetirementFunding: (
      field: keyof RetirementFundingInputs,
      value: unknown
    ) => UpdateResult;

    // Preferences actions
    updatePreferences: (
      field: keyof QuickPlanState["preferences"],
      value: string
    ) => void;

    // Utility actions
    resetStore: () => void;
    resetSection: (section: keyof QuickPlanInputs) => void;
  };
}

// Default state with existing component defaults
export const defaultState: Pick<QuickPlanState, "inputs" | "preferences"> = {
  inputs: {
    basics: {
      currentAge: null,
      annualIncome: null,
      annualExpenses: null,
      investedAssets: null,
    },
    growthRates: {
      incomeGrowthRate: 3,
      expenseGrowthRate: 3,
    },
    allocation: {
      stockAllocation: 70,
      bondAllocation: 30,
      cashAllocation: 0,
    },
    goals: {
      retirementExpenses: null,
      targetRetirementAge: null,
      partTimeIncome: null,
    },
    marketAssumptions: {
      stockReturn: 10,
      bondReturn: 5,
      cashReturn: 3,
      inflationRate: 3,
    },
    retirementFunding: {
      safeWithdrawalRate: 4,
      retirementIncome: 0,
      lifeExpectancy: 85,
      effectiveTaxRate: 15,
    },
  },
  preferences: {
    displayFormat: "today",
    dataStorage: "localStorage",
  },
};

// Clean up existing data if dataStorage preference is "none"
const cleanupExistingData = () => {
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem("quick-plan-storage");
  if (!stored) return;

  try {
    const parsed = JSON.parse(stored);
    if (parsed.state?.preferences?.dataStorage === "none") {
      // Only keep preferences, remove inputs
      const cleanedData = {
        state: {
          preferences: parsed.state.preferences,
        },
        version: parsed.version,
      };
      localStorage.setItem("quick-plan-storage", JSON.stringify(cleanedData));
    }
  } catch (error) {
    // Handle parsing errors - remove corrupted data
    console.warn("Failed to parse quick-plan storage:", error);
    localStorage.removeItem("quick-plan-storage");
  }
};

// Run cleanup on initialization
cleanupExistingData();

// Create the store
export const useQuickPlanStore = create<QuickPlanState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...defaultState,
        actions: {
          // Update actions with validation
          updateBasics: (field, value) => {
            const result = validateField(
              "basics",
              field,
              value,
              get().inputs.basics
            );

            if (result.valid && result.data) {
              set((state) => {
                state.inputs.basics = result.data!;
              });
            }

            return {
              success: result.valid,
              error: result.error,
            };
          },

          updateGrowthRates: (field, value) => {
            const result = validateField(
              "growthRates",
              field,
              value,
              get().inputs.growthRates
            );

            if (result.valid && result.data) {
              set((state) => {
                state.inputs.growthRates = result.data!;
              });
            }

            return {
              success: result.valid,
              error: result.error,
            };
          },

          updateAllocation: (data) => {
            const result = validateSection("allocation", data);

            if (result.valid && result.data) {
              set((state) => {
                state.inputs.allocation = result.data!;
              });
            }

            return {
              success: result.valid,
              error: result.error,
            };
          },

          updateGoals: (field, value) => {
            const result = validateField(
              "goals",
              field,
              value,
              get().inputs.goals
            );

            if (result.valid && result.data) {
              set((state) => {
                state.inputs.goals = result.data!;
              });
            }

            return {
              success: result.valid,
              error: result.error,
            };
          },

          updateMarketAssumptions: (field, value) => {
            const result = validateField(
              "marketAssumptions",
              field,
              value,
              get().inputs.marketAssumptions
            );

            if (result.valid && result.data) {
              set((state) => {
                state.inputs.marketAssumptions = result.data!;
              });
            }

            return {
              success: result.valid,
              error: result.error,
            };
          },

          updateRetirementFunding: (field, value) => {
            const result = validateField(
              "retirementFunding",
              field,
              value,
              get().inputs.retirementFunding
            );

            if (result.valid && result.data) {
              set((state) => {
                state.inputs.retirementFunding = result.data!;
              });
            }

            return {
              success: result.valid,
              error: result.error,
            };
          },

          // Preferences actions
          updatePreferences: (field, value) =>
            set((state) => {
              if (field === "displayFormat") {
                state.preferences.displayFormat = value as "today" | "future";
              } else if (field === "dataStorage") {
                state.preferences.dataStorage = value as
                  | "localStorage"
                  | "none";
              }
            }),

          // Utility actions
          resetStore: () =>
            set((state) => {
              Object.assign(state.inputs, defaultState.inputs);
            }),

          resetSection: (section) =>
            set((state) => {
              Object.assign(
                state.inputs[section],
                defaultState.inputs[section]
              );
            }),
        },
      })),
      {
        name: "quick-plan-storage",
        version: 1,
        // Only persist the inputs and preferences state, not the actions
        partialize: (state) => {
          const baseResult = { preferences: state.preferences };

          if (state.preferences.dataStorage === "localStorage") {
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
      name: "Quick Plan Store",
    }
  )
);

// Data selectors (stable references)
export const useBasicsData = () =>
  useQuickPlanStore((state) => state.inputs.basics);
export const useGrowthRatesData = () =>
  useQuickPlanStore((state) => state.inputs.growthRates);
export const useAllocationData = () =>
  useQuickPlanStore((state) => state.inputs.allocation);
export const useGoalsData = () =>
  useQuickPlanStore((state) => state.inputs.goals);
export const useMarketAssumptionsData = () =>
  useQuickPlanStore((state) => state.inputs.marketAssumptions);
export const useRetirementFundingData = () =>
  useQuickPlanStore((state) => state.inputs.retirementFunding);

// Individual field selectors for performance optimization
export const useCurrentAge = () =>
  useQuickPlanStore((state) => state.inputs.basics.currentAge);
export const useAnnualIncome = () =>
  useQuickPlanStore((state) => state.inputs.basics.annualIncome);
export const useAnnualExpenses = () =>
  useQuickPlanStore((state) => state.inputs.basics.annualExpenses);
export const useInvestedAssets = () =>
  useQuickPlanStore((state) => state.inputs.basics.investedAssets);

// Action selectors
export const useUpdateBasics = () =>
  useQuickPlanStore((state) => state.actions.updateBasics);
export const useUpdateGrowthRates = () =>
  useQuickPlanStore((state) => state.actions.updateGrowthRates);
export const useUpdateAllocation = () =>
  useQuickPlanStore((state) => state.actions.updateAllocation);
export const useUpdateGoals = () =>
  useQuickPlanStore((state) => state.actions.updateGoals);
export const useUpdateMarketAssumptions = () =>
  useQuickPlanStore((state) => state.actions.updateMarketAssumptions);
export const useUpdateRetirementFunding = () =>
  useQuickPlanStore((state) => state.actions.updateRetirementFunding);

// Preferences selectors
export const usePreferencesData = () =>
  useQuickPlanStore((state) => state.preferences);
export const useUpdatePreferences = () =>
  useQuickPlanStore((state) => state.actions.updatePreferences);

// Utility selectors
export const useResetStore = () =>
  useQuickPlanStore((state) => state.actions.resetStore);
export const useResetSection = () =>
  useQuickPlanStore((state) => state.actions.resetSection);
