/**
 * Simulation execution Web Worker.
 *
 * Runs Monte Carlo (stochastic or historical backtest) simulations in an off-main-thread
 * context. Each worker selects the appropriate engine based on the simulation mode, executes
 * the requested number of simulations, and forwards partial results to the merge worker.
 */

import * as Comlink from 'comlink';

import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';
import {
  MonteCarloSimulationEngine,
  LcgHistoricalBacktestSimulationEngine,
  type MultiSimulationResult,
} from '@/lib/calc/simulation-engine';

import type { MergeWorkerAPI } from './merge.worker';

const simulationAPI = {
  async runSimulation(
    inputs: SimulatorInputs,
    baseSeed: number,
    numSimulations: number,
    simulationMode: 'monteCarloStochasticReturns' | 'monteCarloHistoricalReturns',
    mergeWorker: Comlink.Remote<MergeWorkerAPI>,
    onProgress?: () => void
  ): Promise<void> {
    let res: MultiSimulationResult;
    switch (simulationMode) {
      case 'monteCarloStochasticReturns': {
        const engine = new MonteCarloSimulationEngine(inputs, baseSeed);
        res = engine.runMonteCarloSimulation(numSimulations, onProgress);
        break;
      }
      case 'monteCarloHistoricalReturns': {
        const engine = new LcgHistoricalBacktestSimulationEngine(inputs, baseSeed);
        res = engine.runLcgHistoricalBacktest(numSimulations, onProgress);
        break;
      }
    }

    await mergeWorker.addPartialResult(res);
  },
};

Comlink.expose(simulationAPI);

export type SimulationWorkerAPI = typeof simulationAPI;
