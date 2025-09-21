'use client';

import { useMultiSimulationResult, useMultiSimulationKeyMetrics } from '@/lib/stores/quick-plan-store';
import SectionContainer from '@/components/ui/section-container';

import SimulationMetrics from '../simulation-metrics';
import MultiSimulationMainResults from './multi-simulation-main-results';

interface MultiSimulationResultsProps {
  simulationMode: 'monteCarloStochasticReturns' | 'monteCarloHistoricalReturns';
}

export default function MultiSimulationResults({ simulationMode }: MultiSimulationResultsProps) {
  const { data } = useMultiSimulationResult(simulationMode);
  const { analysis: simulationResult } = data ?? {};
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
        <SimulationMetrics keyMetrics={keyMetrics} />
      </SectionContainer>
      <MultiSimulationMainResults simulation={simulationResult.p50Result} keyMetrics={keyMetrics} />
    </>
  );
}
