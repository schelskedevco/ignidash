import { z } from 'zod';

const filingStatus = z.enum(['single', 'marriedFilingJointly', 'headOfHousehold']);

export type FilingStatus = z.infer<typeof filingStatus>;

export const stateCodeSchema = z.enum([
  'CA', 'NY', 'NJ', 'MN', 'OR', 'HI',
  'IL', 'PA', 'IN', 'MI', 'NC',
  'TX', 'FL', 'NV', 'WA', 'WY', 'SD', 'AK', 'TN', 'NH',
]);

export type StateCode = z.infer<typeof stateCodeSchema>;

export const taxSettingsFormSchema = z.object({
  filingStatus,
  stateOfResidence: stateCodeSchema.optional(),
  numOnMedicare: z.number().min(1).max(2).optional().default(1),
  acaEnhancedSubsidies: z.boolean().optional().default(true),
  benchmarkPremium: z.number().positive().optional(),
});

export type TaxSettingsInputs = z.infer<typeof taxSettingsFormSchema>;
