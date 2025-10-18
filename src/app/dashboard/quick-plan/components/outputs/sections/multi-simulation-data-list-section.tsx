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
        <DescriptionTerm>Average Portfolio Value</DescriptionTerm>
        <DescriptionDetails>{formatNumber(data.averageTotalPortfolioValue, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Min Portfolio Value</DescriptionTerm>
        <DescriptionDetails>{formatNumber(data.minTotalPortfolioValue, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Max Portfolio Value</DescriptionTerm>
        <DescriptionDetails>{formatNumber(data.maxTotalPortfolioValue, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Standard Deviation</DescriptionTerm>
        <DescriptionDetails>{formatNumber(data.stdDevTotalPortfolioValue, 2, '$')}</DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

function PhasesDataListCardV2({ chartData, selectedAge }: DataListCardProps) {
  const data = chartData.phasesData.find((item) => item.age === selectedAge);
  if (!data) return null;

  const formattedAverageRetirementAge =
    data.averageRetirementAge !== -1 && data.averageYearsToRetirement !== -1
      ? `${formatNumber(data.averageRetirementAge, 0)} (in ${formatNumber(data.averageYearsToRetirement, 0)} years)`
      : '∞ (never retires)';

  const formattedAverageBankruptcyAge =
    data.averageBankruptcyAge !== -1 && data.averageYearsToBankruptcy !== -1
      ? `${formatNumber(data.averageBankruptcyAge, 0)} (in ${formatNumber(data.averageYearsToBankruptcy, 0)} years)`
      : '∞ (never goes bankrupt)';

  return (
    <Card className="my-0">
      <Subheading level={4}>
        <span className="mr-2">Details</span>
        <span className="text-muted-foreground hidden sm:inline">Summary</span>
      </Subheading>
      <DescriptionList>
        <DescriptionTerm>Chance of Retirement</DescriptionTerm>
        <DescriptionDetails>{`${formatNumber(data.chanceOfRetirement * 100, 1)}%`}</DescriptionDetails>

        <DescriptionTerm>Average Retirement Age</DescriptionTerm>
        <DescriptionDetails>{formattedAverageRetirementAge}</DescriptionDetails>

        <DescriptionTerm>Chance of Bankruptcy</DescriptionTerm>
        <DescriptionDetails>{`${formatNumber(data.chanceOfBankruptcy * 100, 1)}%`}</DescriptionDetails>

        <DescriptionTerm>Average Bankruptcy Age</DescriptionTerm>
        <DescriptionDetails>{formattedAverageBankruptcyAge}</DescriptionDetails>
      </DescriptionList>
    </Card>
  );
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
