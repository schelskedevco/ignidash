import { v, type Infer } from 'convex/values';

const keyMetricsBaseValidator = {
  success: v.number(),
  retirementAge: v.nullable(v.number()),
  yearsToRetirement: v.nullable(v.number()),
  bankruptcyAge: v.nullable(v.number()),
  yearsToBankruptcy: v.nullable(v.number()),
  portfolioAtRetirement: v.nullable(v.number()),
  lifetimeTaxesAndPenalties: v.number(),
  finalPortfolio: v.number(),
  progressToRetirement: v.nullable(v.number()),
};

export const keyMetricsValidator = v.union(
  v.object({ type: v.literal('single'), ...keyMetricsBaseValidator }),
  v.object({
    type: v.literal('multi'),
    ...keyMetricsBaseValidator,
    chanceOfRetirement: v.number(),
    chanceOfBankruptcy: v.number(),
    minRetirementAge: v.nullable(v.number()),
    maxRetirementAge: v.nullable(v.number()),
    minBankruptcyAge: v.nullable(v.number()),
    maxBankruptcyAge: v.nullable(v.number()),
  })
);

export type KeyMetrics = Infer<typeof keyMetricsValidator>;
