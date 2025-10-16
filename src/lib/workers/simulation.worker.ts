import * as Comlink from 'comlink';
import { v4 as uuidv4 } from 'uuid';

import type { MonteCarloSortMode } from '@/lib/stores/quick-plan-store';
import type { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';
import { MultiSimulationAnalyzer, type MultiSimulationAnalysis } from '@/lib/calc/v2/multi-simulation-analyzer';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/multi-simulation-table-schema';
import type { MultiSimulationChartData } from '@/lib/types/chart-data-points';
import { TableDataExtractor } from '@/lib/calc/v2/table-data-extractor';
import { SimulationCategory } from '@/lib/types/simulation-category';
import {
  MonteCarloSimulationEngine,
  LcgHistoricalBacktestSimulationEngine,
  type MultiSimulationResult,
} from '@/lib/calc/v2/simulation-engine';
import { ChartDataExtractor } from '../calc/v2/chart-data-extractor';

type CacheEntry = { handle: string; res: MultiSimulationResult };
let cache: CacheEntry | null = null;

type DerivedMultiSimulationData = {
  analysis: MultiSimulationAnalysis;
  tableData: MultiSimulationTableRow[];
  yearlyTableData: YearlyAggregateTableRow[];
  chartData: MultiSimulationChartData;
};

const simulationAPI = {
  async runSimulation(
    inputs: QuickPlanInputs,
    baseSeed: number,
    numSimulations: number,
    simulationMode: 'monteCarloStochasticReturns' | 'monteCarloHistoricalReturns',
    onProgress?: (completed: number) => void
  ): Promise<{ handle: string }> {
    const handle = uuidv4();

    let res: MultiSimulationResult;
    switch (simulationMode) {
      case 'monteCarloStochasticReturns': {
        const engine = new MonteCarloSimulationEngine(inputs, baseSeed);
        res = engine.runMonteCarloSimulation(numSimulations, onProgress);
        break;
      }
      case 'monteCarloHistoricalReturns': {
        const engine = new LcgHistoricalBacktestSimulationEngine(inputs, baseSeed);
        res = engine.runLcgHistoricalBacktest(numSimulations, onProgress);
        break;
      }
    }

    cache = { handle, res };
    return { handle };
  },

  async getDerivedMultiSimulationData(
    handle: string,
    sortMode: MonteCarloSortMode,
    category: SimulationCategory
  ): Promise<DerivedMultiSimulationData> {
    if (!cache || cache.handle !== handle) throw new Error('Simulation not found');
    const { res } = cache;

    const analyzer = new MultiSimulationAnalyzer();
    const analysis = analyzer.analyzeV2(res, sortMode);

    const tableExtractor = new TableDataExtractor();
    const tableData = tableExtractor.extractMultiSimulationData(res, category);
    const yearlyTableData = tableExtractor.extractMultiSimulationYearlyAggregateData(res, analysis, category);

    const chartExtractor = new ChartDataExtractor();
    const portfolioData = chartExtractor.extractMultiSimulationPortfolioChartData(res);
    const phasesData = chartExtractor.extractMultiSimulationPhasesChartData(res);

    return { analysis, tableData, yearlyTableData, chartData: { portfolioData, phasesData } };
  },
};

Comlink.expose(simulationAPI);

export type SimulationWorkerAPI = typeof simulationAPI;
