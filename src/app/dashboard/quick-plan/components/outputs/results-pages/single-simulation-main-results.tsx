'use client';

import { useState, useCallback } from 'react';

import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';
import type { SingleSimulationKeyMetrics } from '@/lib/stores/quick-plan-store';
import { SingleSimulationCategory } from '@/lib/types/single-simulation-category';

import SingleSimulationCategorySelector from '../single-simulation-category-selector';
import SingleSimulationChartsSection from '../sections/single-simulation-charts-section';
import SingleSimulationDataTableSection from '../sections/single-simulation-data-table-section';

interface SingleSimulationMainResultsProps {
  simulation: SimulationResult;
  keyMetrics: SingleSimulationKeyMetrics;
}

export default function SingleSimulationMainResults({ simulation, keyMetrics }: SingleSimulationMainResultsProps) {
  const startAge = simulation.context.startAge;

  const [selectedAge, setSelectedAge] = useState<number>(startAge + 1);
  const onAgeSelect = useCallback(
    (age: number) => {
      if (age >= startAge + 1) setSelectedAge(age);
    },
    [startAge]
  );

  const [currentCategory, setCurrentCategory] = useState<SingleSimulationCategory>(SingleSimulationCategory.Portfolio);

  return (
    <>
      <div>
        <SingleSimulationCategorySelector currentCategory={currentCategory} setCurrentCategory={setCurrentCategory} />
      </div>
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
