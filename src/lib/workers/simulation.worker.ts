/**
 * Simulation execution Web Worker.
 *
 * Runs Monte Carlo (stochastic or historical backtest) simulations in an off-main-thread
 * context. Each worker selects the appropriate engine based on the simulation mode, executes
 * the requested number of simulations, and forwards partial results to the merge worker over a
 * dedicated MessageChannel so the (large) results never pass through the main thread.
 */

import * as Comlink from 'comlink';

import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';
import {
  MonteCarloSimulationEngine,
  LcgHistoricalBacktestSimulationEngine,
  type MultiSimulationResult,
} from '@/lib/calc/simulation-engine';

import type { PartialResultSink } from './merge.worker';

let mergeWorker: Comlink.Remote<PartialResultSink> | null = null;

const simulationAPI = {
  /** Receives this worker's end of a MessageChannel connected to the merge worker. */
  async connectMergeWorker(port: MessagePort): Promise<void> {
    mergeWorker = Comlink.wrap<PartialResultSink>(port);
  },

  async runSimulation(
    inputs: SimulatorInputs,
    baseSeed: number,
    numSimulations: number,
    simulationMode: 'monteCarloStochasticReturns' | 'monteCarloHistoricalReturns',
    onProgress?: () => void
  ): Promise<void> {
    if (!mergeWorker) throw new Error('Merge worker not connected');

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
