import { v, type Infer } from 'convex/values';

const glidePathTimePointValidator = v.object({
  type: v.union(v.literal('customDate'), v.literal('customAge')),
  month: v.optional(v.number()),
  year: v.optional(v.number()),
  age: v.optional(v.number()),
});

export const glidePathValidator = v.object({
  id: v.string(),
  endTimePoint: glidePathTimePointValidator,
  targetBondAllocation: v.number(),
  enabled: v.boolean(),
});

export type GlidePathTimePoint = Infer<typeof glidePathTimePointValidator>;
