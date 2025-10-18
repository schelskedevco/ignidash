import * as Comlink from 'comlink';
import type { SimulationWorkerAPI } from './simulation.worker';

let workers: Worker[] = [];
let workerAPIs: Comlink.Remote<SimulationWorkerAPI>[] = [];

export function createWorkerPool(): Comlink.Remote<SimulationWorkerAPI>[] {
  workers = [];
  workerAPIs = [];

  const optimalSize = getOptimalWorkerCount();
  for (let i = 0; i < optimalSize; i++) {
    const worker = new Worker(new URL('./simulation.worker.ts', import.meta.url), { type: 'module' });
    const api = Comlink.wrap<SimulationWorkerAPI>(worker);

    workers.push(worker);
    workerAPIs.push(api);
  }

  return workerAPIs;
}

export function releaseWorkerPool(): void {
  workerAPIs.forEach((api) => api[Comlink.releaseProxy]());
  workerAPIs = [];

  workers.forEach((w) => w.terminate());
  workers = [];
}

function getOptimalWorkerCount(): number {
  const cores = navigator.hardwareConcurrency || 4;
  return Math.max(1, cores - 1);
}
