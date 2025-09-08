'use client';

import { useState } from 'react';

import { useFixedReturnsSimulationV2, useFixedReturnsKeyMetricsV2 } from '@/lib/stores/quick-plan-store';
import SectionContainer from '@/components/ui/section-container';

import SingleSimulationMetrics from '../single-simulation-metrics';
import SingleSimulationAreaChartCard from '../cards/single-simulation-portfolio-area-chart-card';

export default function SingleSimulationResults() {
  const simulationResult = useFixedReturnsSimulationV2();
  const keyMetrics = useFixedReturnsKeyMetricsV2(simulationResult);

  const startAge = simulationResult?.context.startAge;
  const [selectedAge, setSelectedAge] = useState<number>(startAge! + 1);

  if (!simulationResult || !keyMetrics) return null;

  return (
    <>
      <SectionContainer showBottomBorder>
        <SingleSimulationMetrics keyMetrics={keyMetrics} />
      </SectionContainer>
      <SectionContainer showBottomBorder>
        <div className="mb-4 grid grid-cols-1">
          <SingleSimulationAreaChartCard
            simulation={simulationResult}
            keyMetrics={keyMetrics}
            setSelectedAge={setSelectedAge}
            selectedAge={selectedAge}
          />
        </div>
      </SectionContainer>
    </>
  );
}
