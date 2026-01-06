'use client';

import { memo } from 'react';

import SectionContainer from '@/components/ui/section-container';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import type { SimulationResult } from '@/lib/calc/simulation-engine';

import SingleSimulationDataListSection from './single-simulation-data-list-section';
import SingleSimulationChartCard from '../cards/single-simulation/single-simulation-chart-card';

interface SingleSimulationChartsSectionProps {
  simulation: SimulationResult;
  keyMetrics: KeyMetrics;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
}

function SingleSimulationChartsSection({ simulation, keyMetrics, onAgeSelect, selectedAge }: SingleSimulationChartsSectionProps) {
  const startAge = simulation.context.startAge;
  const props = { simulation, keyMetrics, onAgeSelect, selectedAge, startAge };

  return (
    <SectionContainer showBottomBorder>
      <div className="grid grid-cols-1 gap-2 @[120rem]:grid-cols-2">
        <SingleSimulationChartCard {...props} />
        <div className="@[120rem]:col-span-2">
          <SingleSimulationDataListSection simulation={simulation} selectedAge={selectedAge} />
        </div>
      </div>
    </SectionContainer>
  );
}

// Memoize the entire section to prevent re-renders when props haven't changed
export default memo(SingleSimulationChartsSection);
