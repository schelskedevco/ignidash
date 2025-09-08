'use client';

import { useIsCalculationReady, useMarketAssumptionsData } from '@/lib/stores/quick-plan-store';

import SingleSimulationResults from './results-pages/single-simulation-results';
import FixedReturnsResults from './results-pages/fixed-returns-results';
import MonteCarloResults from './results-pages/monte-carlo-results';
import HistoricalBacktestResults from './results-pages/historical-backtest-results';

const USE_V2 = true;

export default function ResultsSections() {
  const isCalculationReady = useIsCalculationReady();
  const marketAssumptions = useMarketAssumptionsData();

  if (!isCalculationReady) {
    return (
      <div className="text-muted-foreground text-center">
        <p>Results content will be displayed here</p>
      </div>
    );
  }

  if (!USE_V2) {
    switch (marketAssumptions.simulationMode) {
      case 'fixedReturns':
        return <FixedReturnsResults />;
      case 'monteCarlo':
        return <MonteCarloResults />;
      case 'historicalBacktest':
        return <HistoricalBacktestResults />;
    }
  }

  switch (marketAssumptions.simulationMode) {
    case 'fixedReturns':
    case 'historicalReturns':
    case 'stochasticReturns':
      return <SingleSimulationResults />;
    case 'monteCarlo':
    case 'historicalBacktest':
      return null;
  }
}
