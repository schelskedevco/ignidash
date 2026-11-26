/**
 * Worker pool manager for parallel simulation execution.
 *
 * Creates and manages a pool of Web Workers (one per available CPU core minus one)
 * that run financial simulations off the main thread via Comlink RPC. Each worker gets a direct
 * MessageChannel to the merge worker, so partial results never pass through the main thread.
 *
 * Only one pool is active at a time: creating a new pool cancels the previous one, terminating its
 * workers so a superseded run stops consuming CPU immediately.
 */

import * as Comlink from 'comlink';
import { v4 as uuidv4 } from 'uuid';

import type { SimulationWorkerAPI } from './simulation.worker';
import { getMergeWorker } from './merge-worker-api';

/**
 * A pool scoped to a single simulation run. Kept as a value so a superseded run's cleanup
 * can't terminate or disconnect the workers of the run that replaced it.
 */
export type WorkerPool = {
  apis: Comlink.Remote<SimulationWorkerAPI>[];
  runId: string;
  /** Races a promise against the pool's lifetime, so calls into terminated or crashed workers reject instead of hanging. */
  run: <T>(promise: Promise<T>) => Promise<T>;
  /** Terminates the workers and closes all channels. Idempotent. */
  release: () => void;
};

let activePool: WorkerPool | null = null;

export class SimulationCancelledError extends Error {
  constructor() {
    super('Simulation run was cancelled');
    this.name = 'SimulationCancelledError';
  }
}

export async function createWorkerPool(onProgress: () => void): Promise<WorkerPool> {
  activePool?.release();

  const runId = uuidv4();
  const mergeWorker = getMergeWorker();
  const controller = new AbortController();

  const workers: Worker[] = [];
  const apis: Comlink.Remote<SimulationWorkerAPI>[] = [];
  const progressPorts: MessagePort[] = [];
  const connections: Promise<void>[] = [];

  const abortWith = (reason: Error) => {
    if (!controller.signal.aborted) controller.abort(reason);
  };

  const run = <T>(promise: Promise<T>): Promise<T> => {
    const { signal } = controller;
    if (signal.aborted) return Promise.reject(signal.reason);

    return new Promise<T>((resolve, reject) => {
      const onAbort = () => reject(signal.reason);
      signal.addEventListener('abort', onAbort, { once: true });
      promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
    });
  };

  let released = false;
  const release = (): void => {
    if (released) return;
    released = true;

    abortWith(new SimulationCancelledError());

    apis.forEach((api) => api[Comlink.releaseProxy]());
    workers.forEach((w) => w.terminate());
    progressPorts.forEach((p) => p.close());

    void mergeWorker.disconnect(runId);

    if (activePool === pool) activePool = null;
  };

  const optimalSize = getOptimalWorkerCount();
  for (let i = 0; i < optimalSize; i++) {
    const worker = new Worker(new URL('./simulation.worker.ts', import.meta.url), { type: 'module' });
    worker.addEventListener('error', (e) => abortWith(new Error(`Simulation worker failed: ${e.message || 'unknown error'}`)));
    worker.addEventListener('messageerror', () => abortWith(new Error('Simulation worker message could not be deserialized')));

    const api = Comlink.wrap<SimulationWorkerAPI>(worker);

    const merge = new MessageChannel();
    const progress = new MessageChannel();
    progress.port1.onmessage = onProgress;
    progressPorts.push(progress.port1);

    connections.push(mergeWorker.connect(runId, Comlink.transfer(merge.port1, [merge.port1])));
    connections.push(
      api.connect(Comlink.transfer({ mergePort: merge.port2, progressPort: progress.port2 }, [merge.port2, progress.port2]))
    );

    workers.push(worker);
    apis.push(api);
  }

  const pool: WorkerPool = { apis, runId, run, release };
  activePool = pool;

  try {
    await run(Promise.all(connections));
  } catch (err) {
    release();
    throw err;
  }

  return pool;
}

function getOptimalWorkerCount(): number {
  const cores = navigator.hardwareConcurrency || 4;
  return Math.max(1, cores - 1);
}
