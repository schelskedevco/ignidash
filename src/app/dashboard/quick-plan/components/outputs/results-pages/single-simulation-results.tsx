'use client';

import { useState } from 'react';

import { useFixedReturnsSimulationV2 } from '@/lib/stores/quick-plan-store';
import SectionContainer from '@/components/ui/section-container';

import SingleSimulationMetrics from '../single-simulation-metrics';
import SingleSimulationAreaChartCard from '../cards/single-simulation-portfolio-area-chart-card';

export default function SingleSimulationResults() {
  const simulationResult = useFixedReturnsSimulationV2();

  const startAge = simulationResult?.context.startAge;
  const [selectedAge, setSelectedAge] = useState<number>(startAge! + 1);

  if (!simulationResult) return null;

  return (
    <>
      <SectionContainer showBottomBorder>
        <SingleSimulationMetrics result={simulationResult} />
      </SectionContainer>
      <SectionContainer showBottomBorder>
        <div className="mb-4 grid grid-cols-1">
          <SingleSimulationAreaChartCard simulation={simulationResult} setSelectedAge={setSelectedAge} selectedAge={selectedAge} />
        </div>
      </SectionContainer>
    </>
  );
}
