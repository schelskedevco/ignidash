import { z } from 'zod';

import { timelineFormSchema } from './timeline-form-schema';
import { incomeFormSchema } from './income-form-schema';
import { accountFormSchema } from './account-form-schema';
import { expenseFormSchema } from './expense-form-schema';
import { contributionFormSchema, baseContributionSchema } from './contribution-form-schema';
import { marketAssumptionsSchema } from './market-assumptions-schema';

export const simulatorSchema = z.object({
  timeline: timelineFormSchema.nullable(),
  incomes: z.record(z.string(), incomeFormSchema),
  accounts: z.record(z.string(), accountFormSchema),
  expenses: z.record(z.string(), expenseFormSchema),
  contributionRules: z.record(z.string(), contributionFormSchema),
  baseContributionRule: baseContributionSchema,
  marketAssumptions: marketAssumptionsSchema,
});

export type SimulatorInputs = z.infer<typeof simulatorSchema>;
