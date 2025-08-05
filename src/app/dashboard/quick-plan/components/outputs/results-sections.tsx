'use client';

import { useIsCalculationReady, useMarketAssumptionsData } from '@/lib/stores/quick-plan-store';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';

import FixedReturnsOverview from './charts/fixed-returns-overview';
import MonteCarloOverview from './charts/monte-carlo-overview';
import HistoricalBacktestOverview from './charts/historical-backtest-overview';

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

  let resultsOverview;
  switch (marketAssumptions.simulationMode) {
    case 'fixedReturns':
      resultsOverview = <FixedReturnsOverview />;
      break;
    case 'monteCarlo':
      resultsOverview = <MonteCarloOverview />;
      break;
    case 'historicalBacktest':
      resultsOverview = <HistoricalBacktestOverview />;
      break;
  }

  const comingSoon = (
    <div className="text-muted-foreground ml-2 py-10 text-center font-semibold italic">
      <p>Coming soon...</p>
    </div>
  );

  return (
    <>
      {resultsOverview}
      <SectionContainer showBottomBorder>
        <SectionHeader title="Risk Analysis" desc="Understand failure scenarios and what causes them." />
        {comingSoon}
      </SectionContainer>
      <SectionContainer showBottomBorder={false}>
        <SectionHeader title="Summary" desc="AI-powered insights and recommendations based on your simulation results." />
        {comingSoon}
      </SectionContainer>
    </>
  );
}
