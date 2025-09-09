'use client';

import { memo } from 'react';

import SectionContainer from '@/components/ui/section-container';
import {
  type FixedReturnsKeyMetricsV2,
  useSingleSimulationPortfolioAssetTypeAreaChartData,
  useSingleSimulationPortfolioAccountTypeAreaChartData,
} from '@/lib/stores/quick-plan-store';
import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';

import { SingleSimulationCategory } from '../single-simulation-category-selector';
import SingleSimulationPortfolioAssetTypeAreaChartCard from '../cards/single-simulation/single-simulation-portfolio-asset-type-area-chart-card';
import SingleSimulationPortfolioAccountTypeAreaChartCard from '../cards/single-simulation/single-simulation-portfolio-account-type-area-chart-card';
import SingleSimulationPortfolioAssetTypePieChartCard from '../cards/single-simulation/single-simulation-portfolio-asset-type-pie-chart-card';
import SingleSimulationPortfolioAccountTypePieChartCard from '../cards/single-simulation/single-simulation-portfolio-account-type-pie-chart-card';

interface ChartsCategoryProps {
  simulation: SimulationResult;
  keyMetrics: FixedReturnsKeyMetricsV2;
  setSelectedAge: (age: number) => void;
  selectedAge: number;
}

function PortfolioCharts({ simulation, keyMetrics, setSelectedAge, selectedAge }: ChartsCategoryProps) {
  const startAge = simulation.context.startAge;

  const assetTypeRawChartData = useSingleSimulationPortfolioAssetTypeAreaChartData(simulation);
  const accountTypeRawChartData = useSingleSimulationPortfolioAccountTypeAreaChartData(simulation);

  return (
    <>
      <SingleSimulationPortfolioAssetTypeAreaChartCard
        rawChartData={assetTypeRawChartData}
        keyMetrics={keyMetrics}
        setSelectedAge={setSelectedAge}
        selectedAge={selectedAge}
        startAge={startAge}
      />
      <SingleSimulationPortfolioAssetTypePieChartCard simulation={simulation} setSelectedAge={setSelectedAge} selectedAge={selectedAge} />
      <SingleSimulationPortfolioAccountTypeAreaChartCard
        rawChartData={accountTypeRawChartData}
        keyMetrics={keyMetrics}
        setSelectedAge={setSelectedAge}
        selectedAge={selectedAge}
        startAge={startAge}
      />
      <SingleSimulationPortfolioAccountTypePieChartCard simulation={simulation} setSelectedAge={setSelectedAge} selectedAge={selectedAge} />
    </>
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
