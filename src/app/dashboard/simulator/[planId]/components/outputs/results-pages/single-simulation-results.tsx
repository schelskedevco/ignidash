'use client';

import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';
import { useSimulationResult, useKeyMetrics } from '@/lib/stores/simulator-store';
import SectionContainer from '@/components/ui/section-container';

import SimulationMetrics from '../simulation-metrics';
import SingleSimulationResultsContent from './single-simulation-results-content';

interface SingleSimulationResultsProps {
  inputs: SimulatorInputs;
  simulationMode: 'fixedReturns' | 'stochasticReturns' | 'historicalReturns';
}

export default function SingleSimulationResults({ inputs, simulationMode }: SingleSimulationResultsProps) {
  const simulationResult = useSimulationResult(inputs, simulationMode);
  const keyMetrics = useKeyMetrics(simulationResult);

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
        <SimulationMetrics keyMetrics={keyMetrics} simulationResult={simulationResult} />
      </SectionContainer>
      <SingleSimulationResultsContent simulation={simulationResult} keyMetrics={keyMetrics} />
    </>
  );
}
