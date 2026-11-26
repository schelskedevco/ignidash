/**
 * Result aggregation and derived data extraction Web Worker.
 *
 * Collects partial MultiSimulationResults from simulation workers, merges them into a
 * single result set, and computes derived analysis data (charts, tables, key metrics).
 * Uses a UUID-keyed cache so the main thread can request derived data without re-merging.
 */

import * as Comlink from 'comlink';
import { v4 as uuidv4 } from 'uuid';

import type { MonteCarloSortMode } from '@/lib/stores/simulator-store';
import { MultiSimulationAnalyzer, type MultiSimulationAnalysis } from '@/lib/calc/data-analyzers/multi-simulation-analyzer';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/tables/multi-simulation-table-schema';
import type { MultiSimulationChartData } from '@/lib/types/chart-data-points';
import { ChartDataExtractor } from '@/lib/calc/data-extractors/chart-data-extractor';
import { TableDataExtractor } from '@/lib/calc/data-extractors/table-data-extractor';
import { KeyMetricsExtractor } from '@/lib/calc/data-extractors/key-metrics-extractor';
import type { MultiSimulationResult } from '@/lib/calc/simulation-engine';
import type { KeyMetrics } from '@/lib/types/key-metrics';

type CacheEntry = { handle: string; res: MultiSimulationResult };
let cache: CacheEntry | null = null;

/** Per-run state, keyed by run ID, so overlapping runs (e.g. a seed change mid-run) never mix results or close each other's ports. */
type RunState = { partialResults: MultiSimulationResult[]; ports: MessagePort[] };
const runs = new Map<string, RunState>();

/** The most recently started run; only its merged result is cached. */
let latestRunId: string | null = null;

/** The narrow API exposed to simulation workers over their dedicated ports. */
export type PartialResultSink = {
  addPartialResult(result: MultiSimulationResult): Promise<void>;
};

type DerivedMultiSimulationData = {
  analysis: MultiSimulationAnalysis;
  tableData: MultiSimulationTableRow[];
  yearlyTableData: YearlyAggregateTableRow[];
  chartData: MultiSimulationChartData;
  keyMetrics: KeyMetrics;
};

function closeRun(runId: string): void {
  runs.get(runId)?.ports.forEach((port) => port.close());
  runs.delete(runId);
}

const mergeAPI = {
  /**
   * Exposes a run-scoped PartialResultSink on a port whose other end is held by a simulation worker,
   * so partial results bypass the main thread.
   */
  async connect(runId: string, port: MessagePort): Promise<void> {
    let run = runs.get(runId);
    if (!run) {
      run = { partialResults: [], ports: [] };
      runs.set(runId, run);
      latestRunId = runId;
    }

    const runState = run;
    const sink: PartialResultSink = {
      async addPartialResult(result) {
        runState.partialResults.push(result);
      },
    };

    Comlink.expose(sink, port);
    run.ports.push(port);
  },

  /** Closes a run's simulation worker ports and drops any unmerged results once its pool is released. Idempotent. */
  async disconnect(runId: string): Promise<void> {
    closeRun(runId);
  },

  /**
   * Merges a run's buffered partial results into the cache and returns a UUID handle for it, then frees the run's state.
   * Rejects for a superseded run, so the caller never receives a handle that isn't backed by the cache.
   */
  async getMergedResult(runId: string): Promise<{ handle: string }> {
    const run = runs.get(runId);
    if (!run) throw new Error('Simulation run not found');

    if (runId !== latestRunId) {
      closeRun(runId);
      throw new Error('Simulation run was superseded');
    }

    const merged: MultiSimulationResult = { simulations: run.partialResults.flatMap((r) => r.simulations) };
    closeRun(runId);

    const handle = uuidv4();
    cache = { handle, res: merged };
    return { handle };
  },

  /** Extracts analysis, chart data, table data, and key metrics from the cached merged result. */
  async getDerivedMultiSimulationData(handle: string, sortMode: MonteCarloSortMode): Promise<DerivedMultiSimulationData> {
    if (!cache || cache.handle !== handle) {
      console.error('Cache miss or invalid handle in getDerivedMultiSimulationData');
      throw new Error('Simulation not found');
    }

    const { res } = cache;

    const analysis = MultiSimulationAnalyzer.analyze(res, sortMode);
    const keyMetrics = KeyMetricsExtractor.extractMultiSimulationMetrics(res);

    const tableData = TableDataExtractor.extractMultiSimulationData(res);
    const yearlyTableData = TableDataExtractor.extractMultiSimulationYearlyAggregateData(res);

    const portfolioData = ChartDataExtractor.extractMultiSimulationPortfolioData(res);
    const phasesData = ChartDataExtractor.extractMultiSimulationPhasesData(res);

    return { analysis, tableData, yearlyTableData, chartData: { portfolioData, phasesData }, keyMetrics };
  },

  /** Drops the cached merged result; per-run buffers are owned by their runs and cleaned up on disconnect. */
  async reset(): Promise<void> {
    cache = null;
  },
};

Comlink.expose(mergeAPI);

export type MergeWorkerAPI = typeof mergeAPI;
