import { z } from 'zod';

import { currencyFieldAllowsZero, currencyFieldForbidsZero, percentageField, ageField } from '@/lib/utils/zod-schema-helpers';

import { timelineFormSchema } from './timeline-form-schema';
import { incomeFormSchema } from './income-form-schema';
import { accountFormSchema } from './account-form-schema';
import { expenseFormSchema } from './expense-form-schema';
import { contributionFormSchema, baseContributionSchema } from './contribution-form-schema';

export const basicsSchema = z.object({
  currentAge: ageField(16, 100, {
    min: 'You must be at least 16 years old to use this calculator',
    max: 'Age cannot exceed 100 years',
  }).nullable(),
  annualIncome: currencyFieldAllowsZero('Annual income cannot be negative (enter 0 if no current income)').nullable(),
  annualExpenses: currencyFieldForbidsZero('Annual expenses must be greater than 0').nullable(),
  investedAssets: currencyFieldAllowsZero('Invested assets cannot be negative (enter 0 if starting from scratch)').nullable(),
});

export const allocationSchema = z
  .object({
    stockAllocation: percentageField(0, 100, 'Stock allocation'),
    bondAllocation: percentageField(0, 100, 'Bond allocation'),
    cashAllocation: percentageField(0, 100, 'Cash allocation'),
  })
  .refine(
    (data) => {
      const total = data.stockAllocation + data.bondAllocation + data.cashAllocation;
      return Math.abs(total - 100) < 0.01;
    },
    {
      message: 'Asset allocation must total 100%',
      path: ['_form'],
    }
  );

export const growthRatesSchema = z.object({
  incomeGrowthRate: percentageField(0, 50, 'Income growth rate'),
  expenseGrowthRate: percentageField(0, 10, 'Expense growth rate'),
});

export const goalsSchema = z.object({
  retirementExpenses: currencyFieldForbidsZero('Retirement expenses are required and must be greater than 0').nullable(),
});

export const marketAssumptionsSchema = z.object({
  stockReturn: percentageField(0, 20, 'Stock return'),
  bondReturn: percentageField(0, 15, 'Bond return'),
  cashReturn: percentageField(0, 10, 'Cash return'),
  inflationRate: percentageField(0, 8, 'Inflation rate'),
});

export const retirementFundingSchema = z.object({
  safeWithdrawalRate: percentageField(2, 6, 'Safe withdrawal rate'),
  retirementIncome: currencyFieldAllowsZero(
    'Passive retirement income cannot be negative (enter 0 if no pensions/Social Security expected)'
  ),
  lifeExpectancy: ageField(50, 110, {
    min: 'Life expectancy must be at least 50 years',
    max: 'Life expectancy must be at most 110 years',
  }),
  effectiveTaxRate: percentageField(0, 50, 'Effective tax rate'),
});

export const quickPlanSchema = z.object({
  // Legacy
  basics: basicsSchema,
  growthRates: growthRatesSchema,
  allocation: allocationSchema,
  goals: goalsSchema,
  retirementFunding: retirementFundingSchema,

  // New
  timeline: timelineFormSchema.optional(),
  incomes: z.record(z.string(), incomeFormSchema),
  accounts: z.record(z.string(), accountFormSchema),
  expenses: z.record(z.string(), expenseFormSchema),
  contributionRules: z.record(z.string(), contributionFormSchema),
  baseContributionRule: baseContributionSchema,
  marketAssumptions: marketAssumptionsSchema,
});

export type QuickPlanInputs = z.infer<typeof quickPlanSchema>;
export type BasicsInputs = z.infer<typeof basicsSchema>;
export type GrowthRatesInputs = z.infer<typeof growthRatesSchema>;
export type AllocationInputs = z.infer<typeof allocationSchema>;
export type GoalsInputs = z.infer<typeof goalsSchema>;
export type MarketAssumptionsInputs = z.infer<typeof marketAssumptionsSchema>;
export type RetirementFundingInputs = z.infer<typeof retirementFundingSchema>;

export const formatZodErrors = (error: z.ZodError) => {
  const formatted: Record<string, string> = {};

  error.issues.forEach((err) => {
    const path = err.path.join('.');
    formatted[path] = err.message;
  });

  return formatted;
};

type ValidSection = keyof QuickPlanInputs & keyof typeof quickPlanSchema.shape;

export const validateField = <T extends ValidSection>(
  section: T,
  field: keyof QuickPlanInputs[T],
  value: unknown,
  currentData: QuickPlanInputs[T]
): { valid: boolean; data?: QuickPlanInputs[T]; error?: string } => {
  const sectionSchema = quickPlanSchema.shape[section];
  const updatedData = { ...currentData, [field]: value };
  const result = sectionSchema.safeParse(updatedData);

  if (result.success) {
    return {
      valid: true,
      data: result.data as QuickPlanInputs[T],
    };
  }

  const { error } = result;
  const relevantIssue =
    error.issues.find((issue) => {
      return issue.path[0] === field || issue.path.length === 0;
    }) || error.issues[0];

  return {
    valid: false,
    error: relevantIssue.message,
  };
};

export const validateSection = <T extends ValidSection>(
  section: T,
  sectionData: unknown
): { valid: boolean; data?: QuickPlanInputs[T]; error?: string } => {
  const sectionSchema = quickPlanSchema.shape[section];
  const result = sectionSchema.safeParse(sectionData);

  if (result.success) {
    return {
      valid: true,
      data: result.data as QuickPlanInputs[T],
    };
  }

  const { error } = result;
  const relevantIssue =
    error.issues.find((issue) => {
      return issue.path[0] === '_form' || issue.path.length === 0;
    }) || error.issues[0];

  return {
    valid: false,
    error: relevantIssue.message,
  };
};
