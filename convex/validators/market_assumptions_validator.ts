import { v } from 'convex/values';

export const marketAssumptionsValidator = v.object({
  stockReturn: v.number(),
  stockYield: v.number(),
  bondReturn: v.number(),
  bondYield: v.number(),
  cashReturn: v.number(),
  inflationRate: v.number(),
});
