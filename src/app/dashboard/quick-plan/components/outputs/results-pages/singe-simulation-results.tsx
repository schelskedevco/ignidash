'use client';

import { useFixedReturnsSimulationV2 } from '@/lib/stores/quick-plan-store';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';

import SingleSimulationMetrics from '../single-simulation-metrics';

export default function SingleSimulationResults() {
  const simulationResult = useFixedReturnsSimulationV2();
  if (!simulationResult) return null;

  return (
    <SectionContainer showBottomBorder>
      <SectionHeader title="Key Metrics" desc="A snapshot of your simulation's most important results." />
      <SingleSimulationMetrics result={simulationResult} />
    </SectionContainer>
  );
}
