import { v, type Infer } from 'convex/values';

export const simulationResultValidator = v.object({
  simulationResult: v.array(v.string()),
});

export type SimulationResult = Infer<typeof simulationResultValidator>;
