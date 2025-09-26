import * as Comlink from 'comlink';
import { v4 as uuidv4 } from 'uuid';

import type { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';
import { MultiSimulationAnalyzer, type MultiSimulationAnalysis } from '@/lib/calc/v2/multi-simulation-analyzer';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/multi-simulation-table-schema';
import { TableDataExtractor } from '@/lib/calc/v2/table-data-extractor';
import { SimulationCategory } from '@/lib/types/simulation-category';
import {
  MonteCarloSimulationEngine,
  LcgHistoricalBacktestSimulationEngine,
  type MultiSimulationResult,
} from '@/lib/calc/v2/simulation-engine';

const simulationCache = new Map<string, MultiSimulationResult>();

const simulationAPI = {
  async runSimulation(
    inputs: QuickPlanInputs,
    baseSeed: number,
    numSimulations: number,
    simulationMode: 'monteCarloStochasticReturns' | 'monteCarloHistoricalReturns'
  ): Promise<{ handle: string }> {
    const key = uuidv4();

    let res: MultiSimulationResult;
    switch (simulationMode) {
      case 'monteCarloStochasticReturns': {
        const engine = new MonteCarloSimulationEngine(inputs, baseSeed);
        res = engine.runMonteCarloSimulation(numSimulations);
        break;
      }
      case 'monteCarloHistoricalReturns': {
        const engine = new LcgHistoricalBacktestSimulationEngine(inputs, baseSeed);
        res = engine.runLcgHistoricalBacktest(numSimulations);
        break;
      }
    }

    simulationCache.set(key, res);
    return { handle: key };
  },

  async getDerivedMultiSimulationData(
    handle: string,
    sortMode: 'retirementAge' | 'finalPortfolioValue' | 'bankruptcyAge' | 'averageStockReturn'
  ): Promise<{ analysis: MultiSimulationAnalysis; tableData: MultiSimulationTableRow[]; yearlyTableData: YearlyAggregateTableRow[] }> {
    const res = simulationCache.get(handle);
    if (!res) throw new Error('Simulation not found');

    const analyzer = new MultiSimulationAnalyzer();
    const analysis = analyzer.analyzeV2(res, sortMode);

    const extractor = new TableDataExtractor();
    const tableData = extractor.extractMultiSimulationData(res, SimulationCategory.Portfolio);
    const yearlyTableData = extractor.extractMultiSimulationYearlyAggregateData(res, analysis, SimulationCategory.Portfolio);

    return { analysis, tableData, yearlyTableData };
  },

  async clear(handle: string): Promise<void> {
    simulationCache.delete(handle);
  },
};

Comlink.expose(simulationAPI);

export type SimulationWorkerAPI = typeof simulationAPI;
