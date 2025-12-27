import * as Comlink from 'comlink';
import { v4 as uuidv4 } from 'uuid';

import type { MonteCarloSortMode } from '@/lib/stores/simulator-store';
import { MultiSimulationAnalyzer, type MultiSimulationAnalysis } from '@/lib/calc/analysis/multi-simulation-analyzer';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/tables/multi-simulation-table-schema';
import type { MultiSimulationChartData } from '@/lib/types/chart-data-points';
import { ChartDataExtractor } from '@/lib/calc/data-extractors/chart-data-extractor';
import { TableDataExtractor } from '@/lib/calc/data-extractors/table-data-extractor';
import { KeyMetricsExtractor } from '@/lib/calc/data-extractors/key-metrics-extractor';
import type { MultiSimulationResult } from '@/lib/calc/simulation-engine';
import type { KeyMetrics } from '@/lib/types/key-metrics';

type CacheEntry = { handle: string; res: MultiSimulationResult };
let cache: CacheEntry | null = null;

let partialResults: MultiSimulationResult[] = [];

type DerivedMultiSimulationData = {
  analysis: MultiSimulationAnalysis;
  tableData: MultiSimulationTableRow[];
  yearlyTableData: YearlyAggregateTableRow[];
  chartData: MultiSimulationChartData;
  keyMetrics: KeyMetrics;
};

const mergeAPI = {
  async addPartialResult(result: MultiSimulationResult): Promise<void> {
    partialResults.push(result);
  },

  async getMergedResult(): Promise<{ handle: string }> {
    const merged: MultiSimulationResult = { simulations: partialResults.flatMap((r) => r.simulations) };
    partialResults = [];

    const handle = uuidv4();
    cache = { handle, res: merged };
    return { handle };
  },

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

    const portfolioData = ChartDataExtractor.extractMultiSimulationPortfolioChartData(res);
    const phasesData = ChartDataExtractor.extractMultiSimulationPhasesChartData(res);

    return { analysis, tableData, yearlyTableData, chartData: { portfolioData, phasesData }, keyMetrics };
  },

  async reset(): Promise<void> {
    cache = null;
    partialResults = [];
  },
};

Comlink.expose(mergeAPI);

export type MergeWorkerAPI = typeof mergeAPI;
