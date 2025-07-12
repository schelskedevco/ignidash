import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// Store state interface
interface QuickPlanState {
  inputs: {
    basics: {
      currentAge: number | undefined;
      annualIncome: number | undefined;
      annualExpenses: number | undefined;
      investedAssets: number | undefined;
    };
    growthRates: {
      incomeGrowthRate: number | undefined;
      expenseGrowthRate: number | undefined;
    };
    allocation: {
      stockAllocation: number | undefined;
      bondAllocation: number | undefined;
      cashAllocation: number | undefined;
    };
    goals: {
      retirementExpenses: number | undefined;
      targetRetirementAge: number | undefined;
      partTimeIncome: number | undefined;
    };
    marketAssumptions: {
      stockReturn: number | undefined;
      bondReturn: number | undefined;
      cashReturn: number | undefined;
      inflationRate: number | undefined;
    };
    retirementFunding: {
      safeWithdrawalRate: number | undefined;
      retirementIncome: number | undefined;
      lifeExpectancy: number | undefined;
      effectiveTaxRate: number | undefined;
    };
  };

  actions: {
    // Basic input actions
    updateBasics: (
      field: keyof QuickPlanState["inputs"]["basics"],
      value: number | undefined
    ) => void;
    updateGrowthRates: (
      field: keyof QuickPlanState["inputs"]["growthRates"],
      value: number | undefined
    ) => void;
    updateAllocation: (
      field: keyof QuickPlanState["inputs"]["allocation"],
      value: number | undefined
    ) => void;
    updateGoals: (
      field: keyof QuickPlanState["inputs"]["goals"],
      value: number | undefined
    ) => void;
    updateMarketAssumptions: (
      field: keyof QuickPlanState["inputs"]["marketAssumptions"],
      value: number | undefined
    ) => void;
    updateRetirementFunding: (
      field: keyof QuickPlanState["inputs"]["retirementFunding"],
      value: number | undefined
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
      currentAge: undefined, // undefined represents empty/unset for required fields
      annualIncome: undefined,
      annualExpenses: undefined,
      investedAssets: undefined,
    },
    growthRates: {
      incomeGrowthRate: 3, // Default from existing component
      expenseGrowthRate: 3, // Default from existing component
    },
    allocation: {
      stockAllocation: 70, // Default from existing component
      bondAllocation: 30, // Default from existing component
      cashAllocation: 0, // Default from existing component
    },
    goals: {
      retirementExpenses: undefined, // undefined represents empty/unset for required field
      targetRetirementAge: undefined, // undefined represents empty/unset for optional field
      partTimeIncome: undefined, // undefined represents empty/unset for optional field
    },
    marketAssumptions: {
      stockReturn: 10, // Default from existing component
      bondReturn: 5, // Default from existing component
      cashReturn: 3, // Default from existing component
      inflationRate: 3, // Default from existing component
    },
    retirementFunding: {
      safeWithdrawalRate: 4, // Default from existing component
      retirementIncome: 0, // Default to 0 (no passive income)
      lifeExpectancy: 85, // Default from existing component
      effectiveTaxRate: 15, // Default from existing component
    },
  },
};

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
        // Only persist the inputs state, not the actions
        partialize: (state) => ({
          inputs: state.inputs,
        }),
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

// Utility selectors
export const useResetStore = () =>
  useQuickPlanStore((state) => state.actions.resetStore);
export const useResetSection = () =>
  useQuickPlanStore((state) => state.actions.resetSection);
