'use client';

import { useIsCalculationReady, useSimulationMode } from '@/lib/stores/quick-plan-store';

import SingleSimulationResults from './results-pages/single-simulation-results';

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

  switch (simulationMode) {
    case 'fixedReturns':
    case 'historicalReturns':
    case 'stochasticReturns':
      return <SingleSimulationResults simulationMode={simulationMode} />;
    case 'monteCarloStochasticReturns':
    case 'monteCarloHistoricalReturns':
      return null;
  }
}
