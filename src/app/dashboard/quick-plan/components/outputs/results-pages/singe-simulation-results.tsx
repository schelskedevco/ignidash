'use client';

import { useFixedReturnsSimulationV2 } from '@/lib/stores/quick-plan-store';
import SectionContainer from '@/components/ui/section-container';

import SingleSimulationMetrics from '../single-simulation-metrics';

export default function SingleSimulationResults() {
  const simulationResult = useFixedReturnsSimulationV2();
  if (!simulationResult) return null;

  return (
    <SectionContainer showBottomBorder>
      <SingleSimulationMetrics result={simulationResult} />
    </SectionContainer>
  );
}
