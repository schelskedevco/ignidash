import { v, type Infer } from 'convex/values';

export const keyMetricsValidator = v.object({
  success: v.number(),
  startAge: v.number(),
  retirementAge: v.nullable(v.number()),
  yearsToRetirement: v.nullable(v.number()),
  bankruptcyAge: v.nullable(v.number()),
  yearsToBankruptcy: v.nullable(v.number()),
  portfolioAtRetirement: v.nullable(v.number()),
  lifetimeTaxesAndPenalties: v.number(),
  finalPortfolio: v.number(),
  progressToRetirement: v.nullable(v.number()),
  areValuesMeans: v.boolean(),
});

export type KeyMetrics = Infer<typeof keyMetricsValidator>;
