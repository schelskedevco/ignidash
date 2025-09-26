import * as Comlink from 'comlink';

import type { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';
import {
  MonteCarloSimulationEngine,
  LcgHistoricalBacktestSimulationEngine,
  type MultiSimulationResult,
} from '@/lib/calc/v2/simulation-engine';
import { SimulationCategory } from '@/lib/types/simulation-category';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/multi-simulation-table-schema';

import { MultiSimulationAnalyzer, type MultiSimulationAnalysis } from '../calc/v2/multi-simulation-analyzer';
import { TableDataExtractor } from '../calc/v2/table-data-extractor';

const simulationAPI = {
  async analyzeMonteCarloSimulation(
    inputs: QuickPlanInputs,
    baseSeed: number,
    numSimulations: number,
    simulationMode: 'monteCarloStochasticReturns' | 'monteCarloHistoricalReturns'
  ): Promise<{ analysis: MultiSimulationAnalysis; tableData: MultiSimulationTableRow[]; yearlyTableData: YearlyAggregateTableRow[] }> {
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

    const analyzer = new MultiSimulationAnalyzer();
    const analysis = analyzer.analyzeV2(res);

    const extractor = new TableDataExtractor();
    const tableData = extractor.extractMultiSimulationData(res, SimulationCategory.Portfolio);
    const yearlyTableData = extractor.extractMultiSimulationYearlyAggregateData(res, analysis, SimulationCategory.Portfolio);

    return { analysis, tableData, yearlyTableData };
  },
};

Comlink.expose(simulationAPI);

export type SimulationWorkerAPI = typeof simulationAPI;
