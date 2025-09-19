import { z } from 'zod';

import { percentageField } from '@/lib/utils/zod-schema-helpers';

import { timelineFormSchema } from './timeline-form-schema';
import { incomeFormSchema } from './income-form-schema';
import { accountFormSchema } from './account-form-schema';
import { expenseFormSchema } from './expense-form-schema';
import { contributionFormSchema, baseContributionSchema } from './contribution-form-schema';

export const marketAssumptionsSchema = z.object({
  stockReturn: percentageField(0, 20, 'Stock return'),
  bondReturn: percentageField(0, 15, 'Bond return'),
  cashReturn: percentageField(0, 10, 'Cash return'),
  inflationRate: percentageField(0, 8, 'Inflation rate'),
});

export const quickPlanSchema = z.object({
  timeline: timelineFormSchema.optional(),
  incomes: z.record(z.string(), incomeFormSchema),
  accounts: z.record(z.string(), accountFormSchema),
  expenses: z.record(z.string(), expenseFormSchema),
  contributionRules: z.record(z.string(), contributionFormSchema),
  baseContributionRule: baseContributionSchema,
  marketAssumptions: marketAssumptionsSchema,
});

export type QuickPlanInputs = z.infer<typeof quickPlanSchema>;
export type MarketAssumptionsInputs = z.infer<typeof marketAssumptionsSchema>;

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
