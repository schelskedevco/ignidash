'use client';

import { useIsCalculationReady, useMarketAssumptionsData } from '@/lib/stores/quick-plan-store';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';

import FixedReturnsResultsChart from './charts/fixed-returns-results-chart';
import MonteCarloResultsChart from './charts/monte-carlo-results-chart';
import HistoricalBacktestResultsChart from './charts/historical-backtest-results-chart';

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

  let resultsChart;
  switch (marketAssumptions.simulationMode) {
    case 'fixedReturns':
      resultsChart = <FixedReturnsResultsChart />;
      break;
    case 'monteCarlo':
      resultsChart = <MonteCarloResultsChart />;
      break;
    case 'historicalBacktest':
      resultsChart = <HistoricalBacktestResultsChart />;
      break;
  }

  return (
    <SectionContainer showBottomBorder>
      <SectionHeader title="Overview" desc="Timeline, milestones, and portfolio projections in one view." />
      {resultsChart}
    </SectionContainer>
  );
}
