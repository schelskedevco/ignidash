import * as Comlink from 'comlink';
import type { SimulationWorkerAPI } from './simulation.worker';

let worker: Worker | null = null;
let workerAPI: Comlink.Remote<SimulationWorkerAPI> | null = null;

export function getSimulationWorker(): Comlink.Remote<SimulationWorkerAPI> {
  if (!worker) {
    worker = new Worker(new URL('./simulation.worker.ts', import.meta.url), {
      type: 'module',
    });
    workerAPI = Comlink.wrap<SimulationWorkerAPI>(worker);
  }
  return workerAPI!;
}

export function releaseSimulationWorker(): void {
  if (workerAPI) {
    workerAPI[Comlink.releaseProxy]();
    workerAPI = null;
  }
  if (worker) {
    worker.terminate();
    worker = null;
  }
}
