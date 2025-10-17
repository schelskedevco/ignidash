'use client';

import { memo } from 'react';

import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { formatNumber } from '@/lib/utils';
import Card from '@/components/ui/card';
import { SimulationCategory } from '@/lib/types/simulation-category';
import { Subheading } from '@/components/catalyst/heading';
import type { MultiSimulationChartData } from '@/lib/types/chart-data-points';

interface DataListCardProps {
  chartData: MultiSimulationChartData;
  selectedAge: number;
}

function PortfolioDataListCardV2({ chartData, selectedAge }: DataListCardProps) {
  const data = chartData.portfolioData.find((item) => item.age === selectedAge);
  if (!data) return null;

  return (
    <Card className="my-0">
      <Subheading level={4}>
        <span className="mr-2">Details</span>
        <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
      </Subheading>
      <DescriptionList>
        <DescriptionTerm>P10 Total Portfolio Value</DescriptionTerm>
        <DescriptionDetails>{formatNumber(data.p10TotalPortfolioValue, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>P25 Total Portfolio Value</DescriptionTerm>
        <DescriptionDetails>{formatNumber(data.p25TotalPortfolioValue, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>P50 Total Portfolio Value</DescriptionTerm>
        <DescriptionDetails>{formatNumber(data.p50TotalPortfolioValue, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>P75 Total Portfolio Value</DescriptionTerm>
        <DescriptionDetails>{formatNumber(data.p75TotalPortfolioValue, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>P90 Total Portfolio Value</DescriptionTerm>
        <DescriptionDetails>{formatNumber(data.p90TotalPortfolioValue, 2, '$')}</DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

function PhasesDataListCardV2({ chartData, selectedAge }: DataListCardProps) {
  const data = chartData.phasesData.find((item) => item.age === selectedAge);
  if (data) return null;

  return null;
}

interface MultiSimulationDataListSectionProps {
  chartData: MultiSimulationChartData;
  selectedAge: number;
  currentCategory: SimulationCategory;
}

function MultiSimulationDataListSection({ chartData, selectedAge, currentCategory }: MultiSimulationDataListSectionProps) {
  const props: DataListCardProps = { chartData, selectedAge };
  switch (currentCategory) {
    case SimulationCategory.Portfolio:
      return (
        <div className="grid grid-cols-1 gap-2">
          <PortfolioDataListCardV2 {...props} />
        </div>
      );
    case SimulationCategory.Phases:
      return (
        <div className="grid grid-cols-1 gap-2">
          <PhasesDataListCardV2 {...props} />
        </div>
      );
    default:
      return (
        <div className="text-muted-foreground ml-2 py-10 text-center font-semibold italic">
          <p>No data available for the selected view.</p>
        </div>
      );
  }
}

// Memoize the entire section to prevent re-renders when props haven't changed
export default memo(MultiSimulationDataListSection);
