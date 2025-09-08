'use client';

import { useState } from 'react';

import { useFixedReturnsSimulationV2, useFixedReturnsKeyMetricsV2 } from '@/lib/stores/quick-plan-store';
import SectionContainer from '@/components/ui/section-container';

import SingleSimulationMetrics from '../single-simulation-metrics';
import SingleSimulationCategorySelector, { SingleSimulationCategory } from '../single-simulation-category-selector';
import SingleSimulationChartsSection from '../sections/single-simulation-charts-section';

export default function SingleSimulationResults() {
  const simulationResult = useFixedReturnsSimulationV2();
  const keyMetrics = useFixedReturnsKeyMetricsV2(simulationResult);

  const startAge = simulationResult?.context.startAge;
  const [selectedAge, setSelectedAge] = useState<number>(startAge! + 1);
  const [currentCategory, setCurrentCategory] = useState<SingleSimulationCategory>(SingleSimulationCategory.Portfolio);

  if (!simulationResult || !keyMetrics) return null;

  return (
    <>
      <SectionContainer showBottomBorder>
        <SingleSimulationMetrics keyMetrics={keyMetrics} />
      </SectionContainer>
      <SingleSimulationCategorySelector currentCategory={currentCategory} setCurrentCategory={setCurrentCategory} />
      <SingleSimulationChartsSection
        simulation={simulationResult}
        keyMetrics={keyMetrics}
        setSelectedAge={setSelectedAge}
        selectedAge={selectedAge}
        currentCategory={currentCategory}
      />
    </>
  );
}
