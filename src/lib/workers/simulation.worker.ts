import * as Comlink from 'comlink';

import type { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';
import {
  MonteCarloSimulationEngine,
  LcgHistoricalBacktestSimulationEngine,
  type MultiSimulationResult,
} from '@/lib/calc/v2/simulation-engine';

const simulationAPI = {
  async runMonteCarloSimulation(inputs: QuickPlanInputs, baseSeed: number, numSimulations: number): Promise<MultiSimulationResult> {
    const engine = new MonteCarloSimulationEngine(inputs, baseSeed);
    const res = engine.runMonteCarloSimulation(numSimulations);

    return res;
  },

  async runHistoricalBacktestSimulation(inputs: QuickPlanInputs, baseSeed: number, numSimulations: number): Promise<MultiSimulationResult> {
    const engine = new LcgHistoricalBacktestSimulationEngine(inputs, baseSeed);
    const res = engine.runLcgHistoricalBacktest(numSimulations);

    return res;
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
