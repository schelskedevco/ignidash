import * as Comlink from 'comlink';
import { SimulationAnalyzer } from '@/lib/calc/simulation-analyzer';
import { MonteCarloSimulationEngine, LcgHistoricalBacktestSimulationEngine, type SimulationResult } from '@/lib/calc/simulation-engine';
import type { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

import type { MultiSimulationResultDTO } from './simulation-dto';

const simulationAPI = {
  async runMonteCarloSimulation(inputs: QuickPlanInputs, baseSeed: number, numSimulations: number): Promise<MultiSimulationResultDTO> {
    const engine = new MonteCarloSimulationEngine(inputs, baseSeed);
    const result = engine.runMonteCarloSimulation(numSimulations);

    return {
      simulations: result.simulations.map(([seed, sim]) => [
        seed,
        {
          ...sim,
          data: sim.data.map(([time, portfolio]) => [
            time,
            { assets: portfolio.assets, contributions: portfolio.contributions, withdrawals: portfolio.withdrawals },
          ]),
          phasesMetadata: sim.phasesMetadata.map(([time, phase]) => [time, phase.type]),
        },
      ]),
    };
  },

  async runHistoricalBacktest(inputs: QuickPlanInputs, baseSeed: number, numSimulations: number): Promise<MultiSimulationResultDTO> {
    const engine = new LcgHistoricalBacktestSimulationEngine(inputs, baseSeed);
    const result = engine.runLcgHistoricalBacktest(numSimulations);

    return {
      simulations: result.simulations.map(([seed, sim]) => [
        seed,
        {
          ...sim,
          data: sim.data.map(([time, portfolio]) => [
            time,
            { assets: portfolio.assets, contributions: portfolio.contributions, withdrawals: portfolio.withdrawals },
          ]),
          phasesMetadata: sim.phasesMetadata.map(([time, phase]) => [time, phase.type]),
        },
      ]),
    };
  },

  async analyzeSimulations(simulationResults: SimulationResult[]) {
    const analyzer = new SimulationAnalyzer();
    return analyzer.analyzeSimulations(simulationResults);
  },

  async analyzeSimulation(simulationResult: SimulationResult) {
    const analyzer = new SimulationAnalyzer();
    return analyzer.analyzeSimulation(simulationResult);
  },
};

Comlink.expose(simulationAPI);

export type SimulationWorkerAPI = typeof simulationAPI;
