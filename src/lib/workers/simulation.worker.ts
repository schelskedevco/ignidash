/**
 * Simulation execution Web Worker.
 *
 * Runs Monte Carlo (stochastic or historical backtest) simulations in an off-main-thread
 * context. Each worker selects the appropriate engine based on the simulation mode, executes
 * the requested number of simulations, and forwards partial results to the merge worker over a
 * dedicated MessageChannel so the (large) results never pass through the main thread.
 *
 * Sends are pipelined: a worker starts its next chunk while the previous result is still being delivered,
 * instead of idling until the merge worker acknowledges it. At most one send is in flight per worker, which
 * bounds memory, and `flush` confirms delivery before the run is merged.
 */

import * as Comlink from 'comlink';

import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';
import {
  MonteCarloSimulationEngine,
  LcgHistoricalBacktestSimulationEngine,
  type MultiSimulationResult,
} from '@/lib/calc/simulation-engine';

import type { PartialResultSink } from './merge.worker';

let mergeWorkerPort: MessagePort | null = null;
let mergeWorker: Comlink.Remote<PartialResultSink> | null = null;
let progressPort: MessagePort | null = null;

/** The in-flight send to the merge worker, if any. Awaited before the next send and by `flush`. */
let pendingSend: Promise<void> = Promise.resolve();

/** Posts a fire-and-forget tick per completed simulation; avoids an RPC round-trip per simulation. */
const reportProgress = () => progressPort?.postMessage(null);

const simulationAPI = {
  /**
   * Receives this worker's ends of two MessageChannels: one connected to the merge worker (partial results),
   * one to the main thread (progress ticks).
   */
  async connect({ mergePort, progressPort: port }: { mergePort: MessagePort; progressPort: MessagePort }): Promise<void> {
    // Workers are reused across runs: drop the previous run's channels before taking the new ones.
    // (Closed directly: Comlink's releaseProxy waits for a reply the merge worker, having closed its end, never sends.)
    mergeWorkerPort?.close();
    progressPort?.close();

    mergeWorkerPort = mergePort;
    mergeWorker = Comlink.wrap<PartialResultSink>(mergePort);
    progressPort = port;
    pendingSend = Promise.resolve();
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

    await pendingSend;
    pendingSend = mergeWorker.addPartialResult(res);
    // Observed here so a failed send isn't reported as unhandled; the error still surfaces from the next send or `flush`.
    pendingSend.catch(() => {});
  },

  /** Resolves once this worker's last partial result has been delivered to the merge worker. */
  async flush(): Promise<void> {
    await pendingSend;
  },
};

Comlink.expose(simulationAPI);

export type SimulationWorkerAPI = typeof simulationAPI;
