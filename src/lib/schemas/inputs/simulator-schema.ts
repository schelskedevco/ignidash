import { z } from 'zod';

import { timelineFormSchema } from './timeline-form-schema';
import { incomeFormSchema } from './income-form-schema';
import { accountFormSchema } from './account-form-schema';
import { glidePathFormSchema } from './glide-path-form-schema';
import { expenseFormSchema } from './expense-form-schema';
import { debtFormSchema } from './debt-form-schema';
import { physicalAssetFormSchema } from './physical-asset-form-schema';
import { contributionFormSchema, baseContributionSchema } from './contribution-form-schema';
import { marketAssumptionsFormSchema } from './market-assumptions-form-schema';
import { taxSettingsFormSchema } from './tax-settings-form-schema';
import { privacySettingsFormSchema } from './privacy-settings-form-schema';
import { simulationSettingsSchema } from '../simulation-settings-schema';

export const simulatorSchema = z.object({
  timeline: timelineFormSchema.nullable(),
  incomes: z.record(z.string(), incomeFormSchema),
  accounts: z.record(z.string(), accountFormSchema),
  glidePath: glidePathFormSchema.optional(),
  expenses: z.record(z.string(), expenseFormSchema),
  debts: z.record(z.string(), debtFormSchema),
  physicalAssets: z.record(z.string(), physicalAssetFormSchema),
  contributionRules: z.record(z.string(), contributionFormSchema),
  baseContributionRule: baseContributionSchema,
  marketAssumptions: marketAssumptionsFormSchema,
  taxSettings: taxSettingsFormSchema,
  privacySettings: privacySettingsFormSchema,
  simulationSettings: simulationSettingsSchema,
});

export type SimulatorInputs = z.infer<typeof simulatorSchema>;
