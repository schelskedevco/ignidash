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
let progressPort: MessagePort | null = null;

/** Posts a fire-and-forget tick per completed simulation; avoids an RPC round-trip per simulation. */
const reportProgress = () => progressPort?.postMessage(null);

const simulationAPI = {
  /**
   * Receives this worker's ends of two MessageChannels: one connected to the merge worker (partial results),
   * one to the main thread (progress ticks).
   */
  async connect({ mergePort, progressPort: port }: { mergePort: MessagePort; progressPort: MessagePort }): Promise<void> {
    mergeWorker = Comlink.wrap<PartialResultSink>(mergePort);
    progressPort = port;
  },

  async runSimulation(
    inputs: SimulatorInputs,
    baseSeed: number,
    numSimulations: number,
    simulationMode: 'monteCarloStochasticReturns' | 'monteCarloHistoricalReturns'
  ): Promise<void> {
    if (!mergeWorker) throw new Error('Merge worker not connected');

    let res: MultiSimulationResult;
    switch (simulationMode) {
      case 'monteCarloStochasticReturns': {
        const engine = new MonteCarloSimulationEngine(inputs, baseSeed);
        res = engine.runMonteCarloSimulation(numSimulations, reportProgress);
        break;
      }
      case 'monteCarloHistoricalReturns': {
        const engine = new LcgHistoricalBacktestSimulationEngine(inputs, baseSeed);
        res = engine.runLcgHistoricalBacktest(numSimulations, reportProgress);
        break;
      }
    }

    await mergeWorker.addPartialResult(res);
  },
};

Comlink.expose(simulationAPI);

export type SimulationWorkerAPI = typeof simulationAPI;
