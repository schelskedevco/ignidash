import * as Comlink from 'comlink';

import type { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

const simulationAPI = {
  async runMonteCarloSimulation(inputs: QuickPlanInputs, baseSeed: number, numSimulations: number): Promise<void> {
    throw new Error('Not implemented yet');
  },

  async runHistoricalBacktestSimulation(inputs: QuickPlanInputs, baseSeed: number, numSimulations: number): Promise<void> {
    throw new Error('Not implemented yet');
  },

  async analyzeMonteCarloSimulation(inputs: QuickPlanInputs, baseSeed: number, numSimulations: number): Promise<void> {
    throw new Error('Not implemented yet');
  },

  async analyzeHistoricalBacktestSimulation(inputs: QuickPlanInputs, baseSeed: number, numSimulations: number): Promise<void> {
    throw new Error('Not implemented yet');
  },

  async generateMonteCarloTableData(inputs: QuickPlanInputs, baseSeed: number, numSimulations: number): Promise<never[]> {
    throw new Error('Not implemented yet');
  },

  async generateHistoricalBacktestTableData(inputs: QuickPlanInputs, baseSeed: number, numSimulations: number): Promise<never[]> {
    throw new Error('Not implemented yet');
  },
};

Comlink.expose(simulationAPI);

export type SimulationWorkerAPI = typeof simulationAPI;
