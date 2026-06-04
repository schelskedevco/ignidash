import { v } from 'convex/values';

const stateCodes = [
  'CA', 'NY', 'NJ', 'MN', 'OR', 'HI',
  'IL', 'PA', 'IN', 'MI', 'NC',
  'TX', 'FL', 'NV', 'WA', 'WY', 'SD', 'AK', 'TN', 'NH',
] as const;

export const taxSettingsValidator = v.object({
  filingStatus: v.union(v.literal('single'), v.literal('marriedFilingJointly'), v.literal('headOfHousehold')),
  stateOfResidence: v.optional(v.union(...stateCodes.map((c) => v.literal(c)))),
  numOnMedicare: v.optional(v.number()),
  acaEnhancedSubsidies: v.optional(v.boolean()),
  benchmarkPremium: v.optional(v.number()),
});
