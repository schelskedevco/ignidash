'use client';

import { useSimulationResultV2, useSingleSimulationKeyMetrics } from '@/lib/stores/quick-plan-store';
import SectionContainer from '@/components/ui/section-container';

import SingleSimulationMetrics from '../single-simulation-metrics';
import SingleSimulationMainResults from './single-simulation-main-results';

interface SingleSimulationResultsProps {
  simulationMode: 'fixedReturns' | 'stochasticReturns' | 'historicalReturns';
}

export default function SingleSimulationResults({ simulationMode }: SingleSimulationResultsProps) {
  const simulationResult = useSimulationResultV2(simulationMode);
  const keyMetrics = useSingleSimulationKeyMetrics(simulationResult);

  if (!simulationResult || !keyMetrics) {
    return (
      <div className="text-muted-foreground text-center">
        <p>Results content will be displayed here...</p>
      </div>
    );
  }

  return (
    <>
      <SectionContainer showBottomBorder>
        <SingleSimulationMetrics keyMetrics={keyMetrics} />
      </SectionContainer>
      <SingleSimulationMainResults simulation={simulationResult} keyMetrics={keyMetrics} />
    </>
  );
}
