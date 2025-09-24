'use client';

import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import SectionContainer from '@/components/ui/section-container';
import { useResultsState } from '@/hooks/use-results-state';

import SimulationCategorySelector from '../simulation-category-selector';
import SingleSimulationChartsSection from '../sections/single-simulation-charts-section';
import SingleSimulationDataListSection from '../sections/single-simulation-data-list-section';
import SingleSimulationDataTableSection from '../sections/single-simulation-data-table-section';

interface SingleSimulationMainResultsProps {
  simulation: SimulationResult;
  keyMetrics: KeyMetrics;
}

export default function SingleSimulationMainResults({ simulation, keyMetrics }: SingleSimulationMainResultsProps) {
  const startAge = simulation.context.startAge;

  const { selectedAge, onAgeSelect, currentCategory, setCurrentCategory } = useResultsState(startAge);

  return (
    <>
      <SectionContainer showBottomBorder>
        <SimulationCategorySelector currentCategory={currentCategory} setCurrentCategory={setCurrentCategory} />
      </SectionContainer>
      <SingleSimulationChartsSection
        simulation={simulation}
        keyMetrics={keyMetrics}
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
        currentCategory={currentCategory}
      />
      <SingleSimulationDataListSection simulation={simulation} selectedAge={selectedAge} currentCategory={currentCategory} />
      <SingleSimulationDataTableSection simulation={simulation} currentCategory={currentCategory} />
    </>
  );
}
