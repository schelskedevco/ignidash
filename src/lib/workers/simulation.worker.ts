import * as Comlink from 'comlink';

import type { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';
import { MonteCarloSimulationEngine, LcgHistoricalBacktestSimulationEngine } from '@/lib/calc/v2/simulation-engine';
import { MultiSimulationAnalyzer, type MultiSimulationAnalysis } from '../calc/v2/multi-simulation-analyzer';

const simulationAPI = {
  async analyzeMonteCarloSimulation(inputs: QuickPlanInputs, baseSeed: number, numSimulations: number): Promise<MultiSimulationAnalysis> {
    const engine = new MonteCarloSimulationEngine(inputs, baseSeed);
    const res = engine.runMonteCarloSimulation(numSimulations);

    const analyzer = new MultiSimulationAnalyzer();
    return analyzer.analyze(res);
  },

  async analyzeHistoricalBacktestSimulation(
    inputs: QuickPlanInputs,
    baseSeed: number,
    numSimulations: number
  ): Promise<MultiSimulationAnalysis> {
    const engine = new LcgHistoricalBacktestSimulationEngine(inputs, baseSeed);
    const res = engine.runLcgHistoricalBacktest(numSimulations);

    const analyzer = new MultiSimulationAnalyzer();
    return analyzer.analyze(res);
  },
};

Comlink.expose(simulationAPI);

export type SimulationWorkerAPI = typeof simulationAPI;
