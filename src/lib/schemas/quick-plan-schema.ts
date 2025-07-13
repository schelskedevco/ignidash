import { z } from "zod";

// Helper function to create a currency field that allows zero
const currencyFieldAllowsZero = (customMessage?: string) => {
  return z.coerce.number().nonnegative(customMessage || "Must be 0 or greater");
};

// Helper function to create a currency field that forbids zero
const currencyFieldForbidsZero = (customMessage?: string) => {
  return z.coerce.number().positive(customMessage || "Must be greater than 0");
};

// Helper function to create a percentage field with custom range
const percentageField = (min = 0, max = 100, fieldName = "Value") => {
  return z.coerce
    .number()
    .min(min, `${fieldName} must be at least ${min}%`)
    .max(max, `${fieldName} must be at most ${max}%`);
};

// Helper function to create an age field with configurable range
const ageField = (
  min = 16,
  max = 100,
  customMessages?: { min?: string; max?: string }
) => {
  return z.coerce
    .number()
    .min(min, customMessages?.min || `Age must be at least ${min}`)
    .max(max, customMessages?.max || `Age must be at most ${max}`);
};

// Basic financial information schema
export const basicsSchema = z.object({
  currentAge: ageField(16, 100, {
    min: "You must be at least 16 years old to use this calculator",
    max: "Age cannot exceed 100 years",
  }).nullable(),
  annualIncome: currencyFieldForbidsZero(
    "Annual income must be greater than 0"
  ).nullable(),
  annualExpenses: currencyFieldForbidsZero(
    "Annual expenses must be greater than 0"
  ).nullable(),
  investedAssets: currencyFieldAllowsZero(
    "Invested assets cannot be negative (enter 0 if starting from scratch)"
  ).nullable(),
});

// Growth rates schema (disclosure section)
export const growthRatesSchema = z.object({
  incomeGrowthRate: percentageField(0, 50, "Income growth rate"),
  expenseGrowthRate: percentageField(0, 10, "Expense growth rate"),
});

// Asset allocation schema (disclosure section)
export const allocationSchema = z
  .object({
    stockAllocation: percentageField(0, 100, "Stock allocation"),
    bondAllocation: percentageField(0, 100, "Bond allocation"),
    cashAllocation: percentageField(0, 100, "Cash allocation"),
  })
  .refine(
    (data) => {
      const total =
        data.stockAllocation + data.bondAllocation + data.cashAllocation;
      return Math.abs(total - 100) < 0.01;
    },
    {
      message: "Asset allocation must total 100%",
      path: ["_form"], // This allows us to show a general form error
    }
  );

// Goals schema
export const goalsSchema = z.object({
  retirementExpenses: currencyFieldForbidsZero(
    "Retirement expenses are required and must be greater than 0"
  ).nullable(),
  targetRetirementAge: ageField(16, 100, {
    min: "Target retirement age must be at least 16",
    max: "Target retirement age cannot exceed 100",
  }).nullable(),
  partTimeIncome: currencyFieldAllowsZero(
    "Part-time income cannot be negative (enter 0 if no part-time work planned)"
  ).nullable(),
});

// Market assumptions schema (drawer)
export const marketAssumptionsSchema = z.object({
  stockReturn: percentageField(0, 20, "Stock return"),
  bondReturn: percentageField(0, 15, "Bond return"),
  cashReturn: percentageField(0, 10, "Cash return"),
  inflationRate: percentageField(0, 8, "Inflation rate"),
});

// Retirement funding schema (drawer)
export const retirementFundingSchema = z.object({
  safeWithdrawalRate: percentageField(2, 6, "Safe withdrawal rate"),
  retirementIncome: currencyFieldAllowsZero(
    "Passive retirement income cannot be negative (enter 0 if no pensions/Social Security expected)"
  ),
  lifeExpectancy: ageField(50, 110, {
    min: "Life expectancy must be at least 50 years",
    max: "Life expectancy must be at most 110 years",
  }),
  effectiveTaxRate: percentageField(0, 50, "Effective tax rate"),
});

// Combined schema for all inputs
export const quickPlanSchema = z.object({
  basics: basicsSchema,
  growthRates: growthRatesSchema,
  allocation: allocationSchema,
  goals: goalsSchema,
  marketAssumptions: marketAssumptionsSchema,
  retirementFunding: retirementFundingSchema,
});

// Type inference
export type QuickPlanInputs = z.infer<typeof quickPlanSchema>;
export type BasicsInputs = z.infer<typeof basicsSchema>;
export type GrowthRatesInputs = z.infer<typeof growthRatesSchema>;
export type AllocationInputs = z.infer<typeof allocationSchema>;
export type GoalsInputs = z.infer<typeof goalsSchema>;
export type MarketAssumptionsInputs = z.infer<typeof marketAssumptionsSchema>;
export type RetirementFundingInputs = z.infer<typeof retirementFundingSchema>;

// Helper function to format Zod errors for UI display
export const formatZodErrors = (error: z.ZodError) => {
  const formatted: Record<string, string> = {};

  error.issues.forEach((err) => {
    const path = err.path.join(".");
    formatted[path] = err.message;
  });

  return formatted;
};
