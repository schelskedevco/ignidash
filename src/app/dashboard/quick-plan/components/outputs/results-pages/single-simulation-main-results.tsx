'use client';

import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import SectionContainer from '@/components/ui/section-container';
import { useResultsState } from '@/hooks/use-results-state';

import SimulationCategorySelector from '../simulation-category-selector';
import SingleSimulationChartsSection from '../sections/single-simulation-charts-section';
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
      <SectionContainer
        showBottomBorder
        className="from-emphasized-background to-background bg-gradient-to-l py-0 xl:sticky xl:top-[4.3125rem] xl:z-10"
      >
        <SimulationCategorySelector currentCategory={currentCategory} setCurrentCategory={setCurrentCategory} />
      </SectionContainer>
      <SingleSimulationChartsSection
        simulation={simulation}
        keyMetrics={keyMetrics}
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
        currentCategory={currentCategory}
      />
      <SingleSimulationDataTableSection simulation={simulation} currentCategory={currentCategory} />
    </>
  );
}
