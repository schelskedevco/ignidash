'use client';

import { useIsCalculationReady, useSimulationMode } from '@/lib/stores/quick-plan-store';

import SingleSimulationResults from './results-pages/single-simulation-results';
import FixedReturnsResults from './results-pages/legacy/fixed-returns-results';
import MonteCarloResults from './results-pages/legacy/monte-carlo-results';
import HistoricalBacktestResults from './results-pages/legacy/historical-backtest-results';

const USE_V2 = true;

export default function ResultsSections() {
  const isCalculationReady = useIsCalculationReady();
  const simulationMode = useSimulationMode();

  if (!isCalculationReady) {
    return (
      <div className="text-muted-foreground text-center">
        <p>Results content will be displayed here</p>
      </div>
    );
  }

  if (!USE_V2) {
    switch (simulationMode) {
      case 'fixedReturns':
        return <FixedReturnsResults />;
      case 'monteCarloStochasticReturns':
        return <MonteCarloResults />;
      case 'monteCarloHistoricalReturns':
        return <HistoricalBacktestResults />;
    }
  }

  switch (simulationMode) {
    case 'fixedReturns':
    case 'historicalReturns':
    case 'stochasticReturns':
      return <SingleSimulationResults />;
    case 'monteCarloStochasticReturns':
    case 'monteCarloHistoricalReturns':
      return null;
  }
}
