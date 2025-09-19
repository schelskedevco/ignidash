import * as Comlink from 'comlink';

import type { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';
import {
  MonteCarloSimulationEngine,
  LcgHistoricalBacktestSimulationEngine,
  type MultiSimulationResult,
} from '@/lib/calc/v2/simulation-engine';
import { MultiSimulationAnalyzer, type MultiSimulationAnalysis } from '../calc/v2/multi-simulation-analyzer';

const simulationAPI = {
  async analyzeMonteCarloSimulation(
    inputs: QuickPlanInputs,
    baseSeed: number,
    numSimulations: number,
    simulationMode: 'monteCarloStochasticReturns' | 'monteCarloHistoricalReturns'
  ): Promise<MultiSimulationAnalysis> {
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
    return analyzer.analyze(res);
  },
};

Comlink.expose(simulationAPI);

export type SimulationWorkerAPI = typeof simulationAPI;
