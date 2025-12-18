import { v, type Infer } from 'convex/values';

export const simulationResultsValidator = v.object({
  simulationResults: v.array(v.string()),
});

export type SimulationResults = Infer<typeof simulationResultsValidator>;
