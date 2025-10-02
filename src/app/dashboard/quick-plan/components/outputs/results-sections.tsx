'use client';

import { useIsCalculationReady, useSimulationMode } from '@/lib/stores/quick-plan-store';

import SingleSimulationResults from './results-pages/single-simulation-results';
import MultiSimulationResults from './results-pages/multi-simulation-results';

export default function ResultsSections() {
  const { timelineIsReady, accountsAreReady, incomesAreReady, expensesAreReady } = useIsCalculationReady();
  const simulationMode = useSimulationMode();

  if (!(timelineIsReady && accountsAreReady && incomesAreReady && expensesAreReady)) {
    return (
      <div className="flex h-[calc(100vh-7.375rem)] flex-col items-center justify-center gap-8 lg:h-[calc(100vh-4.3125rem)]">
        <p className="text-muted-foreground">Results content will be displayed here...</p>
      </div>
    );
  }

  switch (simulationMode) {
    case 'fixedReturns':
    case 'historicalReturns':
    case 'stochasticReturns':
      return <SingleSimulationResults simulationMode={simulationMode} />;
    case 'monteCarloStochasticReturns':
    case 'monteCarloHistoricalReturns':
      return <MultiSimulationResults simulationMode={simulationMode} />;
  }
}
