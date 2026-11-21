/**
 * Worker pool manager for parallel simulation execution.
 *
 * Creates and manages a pool of Web Workers (one per available CPU core minus one)
 * that run financial simulations off the main thread via Comlink RPC. Each worker gets a direct
 * MessageChannel to the merge worker, so partial results never pass through the main thread.
 */

import * as Comlink from 'comlink';
import { v4 as uuidv4 } from 'uuid';

import type { SimulationWorkerAPI } from './simulation.worker';
import { getMergeWorker } from './merge-worker-api';

/**
 * A pool scoped to a single simulation run. Kept as a value (not module state) so overlapping runs,
 * e.g. when inputs change mid-run, can't terminate or disconnect each other's workers.
 */
export type WorkerPool = {
  apis: Comlink.Remote<SimulationWorkerAPI>[];
  runId: string;
  release: () => void;
};

export async function createWorkerPool(): Promise<WorkerPool> {
  const runId = uuidv4();
  const mergeWorker = getMergeWorker();

  const workers: Worker[] = [];
  const apis: Comlink.Remote<SimulationWorkerAPI>[] = [];
  const connections: Promise<void>[] = [];

  const optimalSize = getOptimalWorkerCount();
  for (let i = 0; i < optimalSize; i++) {
    const worker = new Worker(new URL('./simulation.worker.ts', import.meta.url), { type: 'module' });
    const api = Comlink.wrap<SimulationWorkerAPI>(worker);

    const { port1, port2 } = new MessageChannel();
    connections.push(mergeWorker.connect(runId, Comlink.transfer(port1, [port1])));
    connections.push(api.connectMergeWorker(Comlink.transfer(port2, [port2])));

    workers.push(worker);
    apis.push(api);
  }

  const release = (): void => {
    apis.forEach((api) => api[Comlink.releaseProxy]());
    workers.forEach((w) => w.terminate());

    void mergeWorker.disconnect(runId);
  };

  await Promise.all(connections);

  return { apis, runId, release };
}

function getOptimalWorkerCount(): number {
  const cores = navigator.hardwareConcurrency || 4;
  return Math.max(1, cores - 1);
}
