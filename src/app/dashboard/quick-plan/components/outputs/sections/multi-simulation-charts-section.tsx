'use client';

import { memo } from 'react';

import { useCurrentAge } from '@/lib/stores/quick-plan-store';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import { SimulationCategory } from '@/lib/types/simulation-category';
import type { MultiSimulationChartData } from '@/lib/types/chart-data-points';

import MultiSimulationPortfolioAreaChartCard from '../cards/multi-simulation/multi-simulation-portfolio-area-chart-card';
import MultiSimulationPortfolioBarChartCard from '../cards/multi-simulation/multi-simulation-portfolio-bar-chart-card';
import MultiSimulationPhasesAreaChartCard from '../cards/multi-simulation/multi-simulation-phases-area-chart-card';
import MultiSimulationDataListSection from './multi-simulation-data-list-section';

interface ChartsCategoryProps {
  startAge: number;
  chartData: MultiSimulationChartData;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
}

function PortfolioCharts({ chartData, onAgeSelect, selectedAge, startAge }: ChartsCategoryProps) {
  return (
    <>
      <MultiSimulationPortfolioAreaChartCard
        rawChartData={chartData.portfolioData}
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
        startAge={startAge}
      />
      <MultiSimulationPortfolioBarChartCard selectedAge={selectedAge} rawChartData={chartData.portfolioData} />
    </>
  );
}

function PhasesCharts({ chartData, onAgeSelect, selectedAge, startAge }: ChartsCategoryProps) {
  return (
    <>
      <MultiSimulationPhasesAreaChartCard
        rawChartData={chartData.phasesData}
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
        startAge={startAge}
      />
    </>
  );
}

interface MultiSimulationChartsSectionProps {
  chartData: MultiSimulationChartData;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  currentCategory: SimulationCategory;
}

function MultiSimulationChartsSection({ chartData, onAgeSelect, selectedAge, currentCategory }: MultiSimulationChartsSectionProps) {
  const startAge = useCurrentAge()!;
  const props: ChartsCategoryProps = { chartData, onAgeSelect, selectedAge, startAge };

  let chartsComponents = null;
  switch (currentCategory) {
    case SimulationCategory.Portfolio:
      chartsComponents = <PortfolioCharts {...props} />;
      break;
    case SimulationCategory.Phases:
      chartsComponents = <PhasesCharts {...props} />;
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
      <SectionHeader title="Charts" desc="Interactive charts to explore your simulation." className="mb-4" />
      <div className="grid grid-cols-1 gap-2 @[96rem]:grid-cols-2">
        {chartsComponents}
        <div className="@[96rem]:col-span-2">
          <MultiSimulationDataListSection chartData={chartData} selectedAge={selectedAge} currentCategory={currentCategory} />
        </div>
      </div>
    </SectionContainer>
  );
}

// Memoize the entire section to prevent re-renders when props haven't changed
export default memo(MultiSimulationChartsSection);
