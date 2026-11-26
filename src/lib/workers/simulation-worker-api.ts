/**
 * Worker pool manager for parallel simulation execution.
 *
 * Manages a pool of Web Workers (one per available CPU core minus one) that run financial simulations
 * off the main thread via Comlink RPC. Each run gives every worker a fresh, direct MessageChannel to the
 * merge worker, so partial results never pass through the main thread.
 *
 * Workers are kept warm between runs to skip module startup, and terminated after a period of idleness.
 * Only one run is active at a time: starting a new run cancels the previous one by terminating its
 * workers, the only way to stop a synchronous simulation loop.
 */

import * as Comlink from 'comlink';
import { v4 as uuidv4 } from 'uuid';

import type { SimulationWorkerAPI } from './simulation.worker';
import { getMergeWorker } from './merge-worker-api';

/** How long warm workers are kept after a run before being terminated to free their memory. */
const IDLE_TIMEOUT_MS = 60_000;

/**
 * A pool scoped to a single simulation run. Kept as a value so a superseded run's cleanup
 * can't terminate or disconnect the workers of the run that replaced it.
 */
export type WorkerPool = {
  apis: Comlink.Remote<SimulationWorkerAPI>[];
  runId: string;
  /** Races a promise against the run's lifetime, so calls into terminated or crashed workers reject instead of hanging. */
  run: <T>(promise: Promise<T>) => Promise<T>;
  /**
   * Ends the run and closes its channels. With `reuse`, a run that completed normally hands its workers back
   * to be reused by the next run; otherwise (cancelled, failed, or no `reuse`) they are terminated. Idempotent.
   */
  release: (options?: { reuse?: boolean }) => void;
};

/** The workers backing a pool. Outlives a single run when parked for reuse. */
type WorkerSet = {
  workers: Worker[];
  apis: Comlink.Remote<SimulationWorkerAPI>[];
  /** Routes worker crashes to the run currently using this set; null while parked. */
  onError: ((err: Error) => void) | null;
  idleTimer: ReturnType<typeof setTimeout> | null;
};

let activePool: WorkerPool | null = null;
let idleSet: WorkerSet | null = null;

export class SimulationCancelledError extends Error {
  constructor() {
    super('Simulation run was cancelled');
    this.name = 'SimulationCancelledError';
  }
}

export async function createWorkerPool(onProgress: () => void): Promise<WorkerPool> {
  activePool?.release();

  const set = takeIdleSet() ?? spawnWorkerSet();
  const { apis } = set;

  const runId = uuidv4();
  const mergeWorker = getMergeWorker();
  const controller = new AbortController();

  const abortWith = (reason: Error) => {
    if (!controller.signal.aborted) controller.abort(reason);
  };
  set.onError = abortWith;

  const run = <T>(promise: Promise<T>): Promise<T> => {
    const { signal } = controller;
    if (signal.aborted) return Promise.reject(signal.reason);

    return new Promise<T>((resolve, reject) => {
      const onAbort = () => reject(signal.reason);
      signal.addEventListener('abort', onAbort, { once: true });
      promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
    });
  };

  const progressPorts: MessagePort[] = [];
  const connections: Promise<void>[] = [];

  let released = false;
  const release = ({ reuse = false }: { reuse?: boolean } = {}): void => {
    if (released) return;
    released = true;

    if (reuse && !controller.signal.aborted) {
      parkWorkerSet(set);
    } else {
      abortWith(new SimulationCancelledError());
      destroyWorkerSet(set);
    }

    progressPorts.forEach((p) => p.close());
    void mergeWorker.disconnect(runId);

    if (activePool === pool) activePool = null;
  };

  for (const api of apis) {
    const merge = new MessageChannel();
    const progress = new MessageChannel();
    progress.port1.onmessage = onProgress;
    progressPorts.push(progress.port1);

    connections.push(mergeWorker.connect(runId, Comlink.transfer(merge.port1, [merge.port1])));
    connections.push(
      api.connect(Comlink.transfer({ mergePort: merge.port2, progressPort: progress.port2 }, [merge.port2, progress.port2]))
    );
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

function spawnWorkerSet(): WorkerSet {
  const set: WorkerSet = { workers: [], apis: [], onError: null, idleTimer: null };

  const onError = (err: Error) => {
    if (set.onError) {
      set.onError(err);
    } else {
      // A parked worker crashed: drop the whole set so the next run starts fresh.
      if (idleSet === set) idleSet = null;
      destroyWorkerSet(set);
    }
  };

  const optimalSize = getOptimalWorkerCount();
  for (let i = 0; i < optimalSize; i++) {
    const worker = new Worker(new URL('./simulation.worker.ts', import.meta.url), { type: 'module' });
    worker.addEventListener('error', (e) => onError(new Error(`Simulation worker failed: ${e.message || 'unknown error'}`)));
    worker.addEventListener('messageerror', () => onError(new Error('Simulation worker message could not be deserialized')));

    set.workers.push(worker);
    set.apis.push(Comlink.wrap<SimulationWorkerAPI>(worker));
  }

  return set;
}

function takeIdleSet(): WorkerSet | null {
  const set = idleSet;
  idleSet = null;
  if (set?.idleTimer) clearTimeout(set.idleTimer);
  if (set) set.idleTimer = null;
  return set;
}

function parkWorkerSet(set: WorkerSet): void {
  set.onError = null;
  if (idleSet && idleSet !== set) destroyWorkerSet(idleSet);

  idleSet = set;
  set.idleTimer = setTimeout(() => {
    if (idleSet !== set) return;
    idleSet = null;
    destroyWorkerSet(set);
  }, IDLE_TIMEOUT_MS);
}

function destroyWorkerSet(set: WorkerSet): void {
  if (set.idleTimer) clearTimeout(set.idleTimer);
  set.idleTimer = null;
  set.onError = null;

  set.apis.forEach((api) => api[Comlink.releaseProxy]());
  set.workers.forEach((w) => w.terminate());
  set.apis = [];
  set.workers = [];
}

function getOptimalWorkerCount(): number {
  const cores = navigator.hardwareConcurrency || 4;
  return Math.max(1, cores - 1);
}
