import * as Comlink from 'comlink';
import type { MergeWorkerAPI } from './merge.worker';

let mergeWorker: Worker | null = null;
let mergeWorkerAPI: Comlink.Remote<MergeWorkerAPI> | null = null;

export function getMergeWorker(): Comlink.Remote<MergeWorkerAPI> {
  if (!mergeWorker) {
    mergeWorker = new Worker(new URL('./merge.worker.ts', import.meta.url), {
      type: 'module',
    });
    mergeWorkerAPI = Comlink.wrap<MergeWorkerAPI>(mergeWorker);
  }
  return mergeWorkerAPI!;
}

export function releaseMergeWorker(): void {
  if (mergeWorkerAPI) {
    mergeWorkerAPI[Comlink.releaseProxy]();
    mergeWorkerAPI = null;
  }
  if (mergeWorker) {
    mergeWorker.terminate();
    mergeWorker = null;
  }
}
