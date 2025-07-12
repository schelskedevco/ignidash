import { z } from "zod";

// Helper function to create a currency field with coercion
const currencyField = () => {
  return z.coerce.number().nonnegative("Must be 0 or greater");
};

// Helper function to create a percentage field with custom range
const percentageField = (min = 0, max = 100, fieldName = "Value") => {
  return z.coerce
    .number()
    .min(min, `${fieldName} must be at least ${min}%`)
    .max(max, `${fieldName} must be at most ${max}%`);
};

// Helper function to create an age field
const ageField = () => {
  return z.coerce
    .number()
    .min(18, "Age must be at least 18")
    .max(100, "Age must be at most 100");
};

// Basic financial information schema
export const basicsSchema = z.object({
  currentAge: ageField(),
  annualIncome: z.coerce
    .number()
    .positive("Annual income must be greater than 0"),
  annualExpenses: z.coerce
    .number()
    .positive("Annual expenses must be greater than 0"),
  investedAssets: currencyField(),
});

// Growth rates schema (disclosure section)
export const growthRatesSchema = z.object({
  incomeGrowthRate: percentageField(0, 50, "Income growth rate").optional(),
  expenseGrowthRate: percentageField(0, 10, "Expense growth rate").optional(),
});

// Asset allocation schema (disclosure section)
export const allocationSchema = z
  .object({
    stockAllocation: percentageField(0, 100, "Stock allocation").optional(),
    bondAllocation: percentageField(0, 100, "Bond allocation").optional(),
    cashAllocation: percentageField(0, 100, "Cash allocation").optional(),
  })
  .refine(
    (data) => {
      const total =
        (data.stockAllocation ?? 0) +
        (data.bondAllocation ?? 0) +
        (data.cashAllocation ?? 0);
      return Math.abs(total - 100) < 0.01;
    },
    {
      message: "Asset allocation must total 100%",
      path: ["_form"], // This allows us to show a general form error
    }
  );

// Goals schema
export const goalsSchema = z.object({
  retirementExpenses: z.coerce
    .number()
    .positive("Retirement expenses are required and must be greater than 0"),
  targetRetirementAge: z.coerce.number().min(18).max(100).optional(),
  partTimeIncome: z.coerce.number().positive().optional(),
});

// Market assumptions schema (drawer)
export const marketAssumptionsSchema = z.object({
  stockReturn: percentageField(0, 20, "Stock return").optional(),
  bondReturn: percentageField(0, 15, "Bond return").optional(),
  cashReturn: percentageField(0, 10, "Cash return").optional(),
  inflationRate: percentageField(0, 8, "Inflation rate").optional(),
});

// Retirement funding schema (drawer)
export const retirementFundingSchema = z.object({
  safeWithdrawalRate: percentageField(2, 6, "Safe withdrawal rate").optional(),
  retirementIncome: currencyField().optional(),
  lifeExpectancy: z.coerce
    .number()
    .min(50, "Life expectancy must be at least 50 years")
    .max(110, "Life expectancy must be at most 110 years")
    .optional(),
  effectiveTaxRate: percentageField(0, 50, "Effective tax rate").optional(),
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
