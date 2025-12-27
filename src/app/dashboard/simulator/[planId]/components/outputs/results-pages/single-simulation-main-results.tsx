'use client';

import type { SimulationResult } from '@/lib/calc/simulation-engine';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import SectionContainer from '@/components/ui/section-container';
import { useResultsState } from '@/hooks/use-results-state';
import { SingleSimulationCategory } from '@/lib/types/simulation-category';

import SimulationCategorySelector from '../simulation-category-selector';
import SingleSimulationChartsSection from '../sections/single-simulation-charts-section';
import SingleSimulationDataTableSection from '../sections/single-simulation-data-table-section';

interface SingleSimulationMainResultsProps {
  simulation: SimulationResult;
  keyMetrics: KeyMetrics;
}

export default function SingleSimulationMainResults({ simulation, keyMetrics }: SingleSimulationMainResultsProps) {
  const startAge = simulation.context.startAge;

  const { selectedAge, onAgeSelect } = useResultsState(startAge);

  return (
    <>
      <SectionContainer
        showBottomBorder
        className="from-emphasized-background to-background bg-gradient-to-r py-0 xl:sticky xl:top-[4.3125rem] xl:z-10"
      >
        <SimulationCategorySelector
          availableCategories={{ mode: 'single' as const, categories: Object.values(SingleSimulationCategory) }}
        />
      </SectionContainer>
      <SingleSimulationChartsSection simulation={simulation} keyMetrics={keyMetrics} onAgeSelect={onAgeSelect} selectedAge={selectedAge} />
      <SingleSimulationDataTableSection simulation={simulation} />
    </>
  );
}
