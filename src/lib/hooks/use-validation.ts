import { useMemo } from "react";
import {
  basicsSchema,
  growthRatesSchema,
  allocationSchema,
  goalsSchema,
  marketAssumptionsSchema,
  retirementFundingSchema,
  formatZodErrors,
  type BasicsInputs,
  type GrowthRatesInputs,
  type AllocationInputs,
  type GoalsInputs,
  type MarketAssumptionsInputs,
  type RetirementFundingInputs,
} from "../schemas/quick-plan-schema";

// Validation hooks that use useMemo to prevent infinite loops
export const useBasicsValidation = (data: BasicsInputs) => {
  return useMemo(() => {
    const validation = basicsSchema.safeParse(data);
    return {
      errors: validation.success ? {} : formatZodErrors(validation.error),
      isValid: validation.success,
    };
  }, [data]);
};

export const useGrowthRatesValidation = (data: GrowthRatesInputs) => {
  return useMemo(() => {
    const validation = growthRatesSchema.safeParse(data);
    return {
      errors: validation.success ? {} : formatZodErrors(validation.error),
      isValid: validation.success,
    };
  }, [data]);
};

export const useAllocationValidation = (data: AllocationInputs) => {
  return useMemo(() => {
    const validation = allocationSchema.safeParse(data);

    // Calculate total for UI display
    const total =
      (data.stockAllocation ?? 0) +
      (data.bondAllocation ?? 0) +
      (data.cashAllocation ?? 0);

    return {
      errors: validation.success ? {} : formatZodErrors(validation.error),
      isValid: validation.success,
      total: Math.round(total * 100) / 100, // Round to 2 decimal places
    };
  }, [data]);
};

export const useGoalsValidation = (data: GoalsInputs) => {
  return useMemo(() => {
    const validation = goalsSchema.safeParse(data);
    return {
      errors: validation.success ? {} : formatZodErrors(validation.error),
      isValid: validation.success,
    };
  }, [data]);
};

export const useMarketAssumptionsValidation = (
  data: MarketAssumptionsInputs
) => {
  return useMemo(() => {
    const validation = marketAssumptionsSchema.safeParse(data);
    return {
      errors: validation.success ? {} : formatZodErrors(validation.error),
      isValid: validation.success,
    };
  }, [data]);
};

export const useRetirementFundingValidation = (
  data: RetirementFundingInputs
) => {
  return useMemo(() => {
    const validation = retirementFundingSchema.safeParse(data);
    return {
      errors: validation.success ? {} : formatZodErrors(validation.error),
      isValid: validation.success,
    };
  }, [data]);
};
