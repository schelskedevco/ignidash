'use client';

import { memo } from 'react';

import SectionContainer from '@/components/ui/section-container';
import type { FixedReturnsKeyMetricsV2 } from '@/lib/stores/quick-plan-store';
import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';

import { SingleSimulationCategory } from '../single-simulation-category-selector';
import SingleSimulationPortfolioAreaChartCard from '../cards/single-simulation-portfolio-area-chart-card';

interface ChartsCategoryProps {
  simulation: SimulationResult;
  keyMetrics: FixedReturnsKeyMetricsV2;
  setSelectedAge: (age: number) => void;
  selectedAge: number;
}

function PortfolioCharts({ simulation, keyMetrics, setSelectedAge, selectedAge }: ChartsCategoryProps) {
  return (
    <SingleSimulationPortfolioAreaChartCard
      simulation={simulation}
      keyMetrics={keyMetrics}
      setSelectedAge={setSelectedAge}
      selectedAge={selectedAge}
    />
  );
}

interface SingleSimulationChartsSectionProps {
  simulation: SimulationResult;
  keyMetrics: FixedReturnsKeyMetricsV2;
  setSelectedAge: (age: number) => void;
  selectedAge: number;
  currentCategory: SingleSimulationCategory;
}

function SingleSimulationChartsSection({
  simulation,
  keyMetrics,
  setSelectedAge,
  selectedAge,
  currentCategory,
}: SingleSimulationChartsSectionProps) {
  let chartsComponents = null;
  switch (currentCategory) {
    case SingleSimulationCategory.Portfolio:
      chartsComponents = (
        <PortfolioCharts simulation={simulation} keyMetrics={keyMetrics} setSelectedAge={setSelectedAge} selectedAge={selectedAge} />
      );
      break;
    default:
      chartsComponents = (
        <div className="text-muted-foreground ml-2 py-10 text-center font-semibold italic">
          <p>Coming soon...</p>
        </div>
      );
      break;
  }

  return (
    <SectionContainer showBottomBorder>
      <div className="mb-4 grid grid-cols-1 gap-2 @6xl:grid-cols-2">{chartsComponents}</div>
    </SectionContainer>
  );
}

// Memoize the entire section to prevent re-renders when props haven't changed
export default memo(SingleSimulationChartsSection);
