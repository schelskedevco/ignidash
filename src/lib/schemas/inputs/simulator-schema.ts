import { z } from 'zod';

import { timelineFormSchema } from './timeline-form-schema';
import { incomeFormSchema } from './income-form-schema';
import { accountFormSchema } from './account-form-schema';
import { glidePathSchema } from './glide-path-schema';
import { expenseFormSchema } from './expense-form-schema';
import { debtFormSchema } from './debt-schema';
import { physicalAssetFormSchema } from './physical-asset-schema';
import { contributionFormSchema, baseContributionSchema } from './contribution-form-schema';
import { marketAssumptionsSchema } from './market-assumptions-schema';
import { taxSettingsSchema } from './tax-settings-schema';
import { privacySettingsSchema } from './privacy-settings-schema';
import { simulationSettingsSchema } from '../simulation-settings-schema';

export const simulatorSchema = z.object({
  timeline: timelineFormSchema.nullable(),
  incomes: z.record(z.string(), incomeFormSchema),
  accounts: z.record(z.string(), accountFormSchema),
  glidePath: glidePathSchema.optional(),
  expenses: z.record(z.string(), expenseFormSchema),
  debts: z.record(z.string(), debtFormSchema),
  physicalAssets: z.record(z.string(), physicalAssetFormSchema),
  contributionRules: z.record(z.string(), contributionFormSchema),
  baseContributionRule: baseContributionSchema,
  marketAssumptions: marketAssumptionsSchema,
  taxSettings: taxSettingsSchema,
  privacySettings: privacySettingsSchema,
  simulationSettings: simulationSettingsSchema,
});

export type SimulatorInputs = z.infer<typeof simulatorSchema>;
