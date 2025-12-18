import { v, type Infer } from 'convex/values';

export const simulationDataPointValidator = v.object({
  age: v.number(),
  stockHoldings: v.number(),
  bondHoldings: v.number(),
  cashHoldings: v.number(),
  taxableValue: v.number(),
  taxDeferredValue: v.number(),
  taxFreeValue: v.number(),
  cashSavings: v.number(),
});

export const simulationResultValidator = v.object({
  simulationResult: v.array(simulationDataPointValidator),
});

export type SimulationResult = Infer<typeof simulationResultValidator>;
