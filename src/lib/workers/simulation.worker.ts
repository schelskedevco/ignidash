import * as Comlink from 'comlink';
import { SimulationAnalyzer, type AggregateSimulationStats } from '@/lib/calc/simulation-analyzer';
import { MonteCarloSimulationEngine, LcgHistoricalBacktestSimulationEngine } from '@/lib/calc/simulation-engine';
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

  async runHistoricalBacktestSimulation(
    inputs: QuickPlanInputs,
    baseSeed: number,
    numSimulations: number
  ): Promise<MultiSimulationResultDTO> {
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

  async analyzeMonteCarloSimulation(
    inputs: QuickPlanInputs,
    baseSeed: number,
    numSimulations: number
  ): Promise<AggregateSimulationStats | null> {
    const engine = new MonteCarloSimulationEngine(inputs, baseSeed);
    const result = engine.runMonteCarloSimulation(numSimulations);

    const analyzer = new SimulationAnalyzer();
    const simulationData = result.simulations.map(([, result]) => result);

    return analyzer.analyzeSimulations(simulationData);
  },

  async analyzeHistoricalBacktestSimulation(
    inputs: QuickPlanInputs,
    baseSeed: number,
    numSimulations: number
  ): Promise<AggregateSimulationStats | null> {
    const engine = new LcgHistoricalBacktestSimulationEngine(inputs, baseSeed);
    const result = engine.runLcgHistoricalBacktest(numSimulations);

    const analyzer = new SimulationAnalyzer();
    const simulationData = result.simulations.map(([, result]) => result);

    return analyzer.analyzeSimulations(simulationData);
  },
};

Comlink.expose(simulationAPI);

export type SimulationWorkerAPI = typeof simulationAPI;
