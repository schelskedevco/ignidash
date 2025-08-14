'use client';

import { useIsCalculationReady, useMarketAssumptionsData } from '@/lib/stores/quick-plan-store';

import FixedReturnsResults from './results-pages/fixed-returns-results';
import MonteCarloResults from './results-pages/monte-carlo-results';
import HistoricalBacktestResults from './results-pages/historical-backtest-results';

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

  switch (marketAssumptions.simulationMode) {
    case 'fixedReturns':
      return <FixedReturnsResults />;
    case 'monteCarlo':
      return <MonteCarloResults />;
    case 'historicalBacktest':
      return <HistoricalBacktestResults />;
  }
}
