'use client';

import { useMultiSimulationResult, useMultiSimulationKeyMetrics } from '@/lib/stores/quick-plan-store';
import SectionContainer from '@/components/ui/section-container';

import SingleSimulationMetrics from '../single-simulation-metrics';
import SingleSimulationMainResults from './single-simulation-main-results';

interface MultiSimulationResultsProps {
  simulationMode: 'monteCarloStochasticReturns' | 'monteCarloHistoricalReturns';
}

export default function MultiSimulationResults({ simulationMode }: MultiSimulationResultsProps) {
  const { data: simulationResult } = useMultiSimulationResult(simulationMode);
  const keyMetrics = useMultiSimulationKeyMetrics(simulationResult ?? null);

  if (!simulationResult || !keyMetrics) {
    return (
      <div className="text-muted-foreground text-center">
        <p>Results content will be displayed here...</p>
      </div>
    );
  }

  return (
    <>
      <SectionContainer showBottomBorder className="mb-0">
        <SingleSimulationMetrics keyMetrics={keyMetrics} />
      </SectionContainer>
      <SingleSimulationMainResults simulation={simulationResult.p50Result} keyMetrics={keyMetrics} />
    </>
  );
}
