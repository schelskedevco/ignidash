import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// Store state interface
interface QuickPlanState {
  inputs: {
    basics: {
      currentAge: number | null;
      annualIncome: number | null;
      annualExpenses: number | null;
      investedAssets: number | null;
    };
    growthRates: {
      incomeGrowthRate: number;
      expenseGrowthRate: number;
    };
    allocation: {
      stockAllocation: number;
      bondAllocation: number;
      cashAllocation: number;
    };
    goals: {
      retirementExpenses: number | null;
      targetRetirementAge: number | null;
      partTimeIncome: number | null;
    };
    marketAssumptions: {
      stockReturn: number;
      bondReturn: number;
      cashReturn: number;
      inflationRate: number;
    };
    retirementFunding: {
      safeWithdrawalRate: number;
      retirementIncome: number;
      lifeExpectancy: number;
      effectiveTaxRate: number;
    };
  };

  preferences: {
    displayFormat: "today" | "future";
    dataStorage: "localStorage" | "none";
  };

  actions: {
    // Basic input actions
    updateBasics: (
      field: keyof QuickPlanState["inputs"]["basics"],
      value: number | null
    ) => void;
    updateGrowthRates: (
      field: keyof QuickPlanState["inputs"]["growthRates"],
      value: number
    ) => void;
    updateAllocation: (
      field: keyof QuickPlanState["inputs"]["allocation"],
      value: number
    ) => void;
    updateGoals: (
      field: keyof QuickPlanState["inputs"]["goals"],
      value: number | null
    ) => void;
    updateMarketAssumptions: (
      field: keyof QuickPlanState["inputs"]["marketAssumptions"],
      value: number
    ) => void;
    updateRetirementFunding: (
      field: keyof QuickPlanState["inputs"]["retirementFunding"],
      value: number
    ) => void;

    // Preferences actions
    updatePreferences: (
      field: keyof QuickPlanState["preferences"],
      value: string
    ) => void;

    // Utility actions
    resetStore: () => void;
    resetSection: (section: keyof QuickPlanState["inputs"]) => void;
  };
}

// Default state with existing component defaults
const defaultState: Omit<QuickPlanState, "actions"> = {
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
      immer((set) => ({
        ...defaultState,
        actions: {
          // Basic input update actions
          updateBasics: (field, value) =>
            set((state) => {
              state.inputs.basics[field] = value;
            }),

          updateGrowthRates: (field, value) =>
            set((state) => {
              state.inputs.growthRates[field] = value;
            }),

          updateAllocation: (field, value) =>
            set((state) => {
              state.inputs.allocation[field] = value;
            }),

          updateGoals: (field, value) =>
            set((state) => {
              state.inputs.goals[field] = value;
            }),

          updateMarketAssumptions: (field, value) =>
            set((state) => {
              state.inputs.marketAssumptions[field] = value;
            }),

          updateRetirementFunding: (field, value) =>
            set((state) => {
              state.inputs.retirementFunding[field] = value;
            }),

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
              Object.assign(state, defaultState);
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
