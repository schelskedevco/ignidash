import * as Comlink from 'comlink';
import { v4 as uuidv4 } from 'uuid';

import type { MonteCarloSortMode } from '@/lib/stores/quick-plan-store';
import { MultiSimulationAnalyzer, type MultiSimulationAnalysis } from '@/lib/calc/v2/multi-simulation-analyzer';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/multi-simulation-table-schema';
import type { MultiSimulationChartData } from '@/lib/types/chart-data-points';
import { ChartDataExtractor } from '@/lib/calc/v2/chart-data-extractor';
import { TableDataExtractor } from '@/lib/calc/v2/table-data-extractor';
import { KeyMetricsExtractor } from '@/lib/calc/v2/key-metrics-extractor';
import { SimulationCategory } from '@/lib/types/simulation-category';
import type { MultiSimulationResult } from '@/lib/calc/v2/simulation-engine';
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

  async getDerivedMultiSimulationData(
    handle: string,
    sortMode: MonteCarloSortMode,
    category: SimulationCategory
  ): Promise<DerivedMultiSimulationData> {
    if (!cache || cache.handle !== handle) {
      console.error('Cache miss or invalid handle in getDerivedMultiSimulationData');
      throw new Error('Simulation not found');
    }

    const { res } = cache;

    const analyzer = new MultiSimulationAnalyzer();
    const analysis = analyzer.analyze(res, sortMode);

    const keyMetrics = KeyMetricsExtractor.extractMultiSimulation(res);

    const tableExtractor = new TableDataExtractor();
    const tableData = tableExtractor.extractMultiSimulationData(res, category);
    const yearlyTableData = tableExtractor.extractMultiSimulationYearlyAggregateData(res, analysis, category);

    const chartExtractor = new ChartDataExtractor();
    const portfolioData = chartExtractor.extractMultiSimulationPortfolioChartData(res);
    const phasesData = chartExtractor.extractMultiSimulationPhasesChartData(res);

    return { analysis, tableData, yearlyTableData, chartData: { portfolioData, phasesData }, keyMetrics };
  },
};

Comlink.expose(mergeAPI);

export type MergeWorkerAPI = typeof mergeAPI;
