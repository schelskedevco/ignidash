import { v } from 'convex/values';

export const simulationSettingsValidator = v.object({
  simulationSeed: v.number(),
  simulationMode: v.union(
    v.literal('fixedReturns'),
    v.literal('stochasticReturns'),
    v.literal('historicalReturns'),
    v.literal('monteCarloStochasticReturns'),
    v.literal('monteCarloHistoricalReturns')
  ),
  historicalStartYearOverride: v.optional(v.number()),
  historicalRetirementStartYearOverride: v.optional(v.number()),
});
