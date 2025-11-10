'use client';

import { memo } from 'react';

import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { formatNumber } from '@/lib/utils';
import Card from '@/components/ui/card';
import { SimulationCategory } from '@/lib/types/simulation-category';
import { Subheading } from '@/components/catalyst/heading';
import type { MultiSimulationChartData } from '@/lib/types/chart-data-points';
import { useResultsCategory } from '@/lib/stores/simulator-store';

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
        <DescriptionTerm>Mean Portfolio Value</DescriptionTerm>
        <DescriptionDetails>{formatNumber(data.meanPortfolioValue, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Min Portfolio Value</DescriptionTerm>
        <DescriptionDetails>{formatNumber(data.minPortfolioValue, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Max Portfolio Value</DescriptionTerm>
        <DescriptionDetails>{formatNumber(data.maxPortfolioValue, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Standard Deviation</DescriptionTerm>
        <DescriptionDetails>{formatNumber(data.stdDevPortfolioValue, 2, '$')}</DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

function PhasesDataListCardV2({ chartData, selectedAge }: DataListCardProps) {
  const data = chartData.phasesData.find((item) => item.age === selectedAge);
  if (!data) return null;

  const formattedMeanRetirementAge =
    data.meanRetirementAge !== -1 && data.meanYearsToRetirement !== -1
      ? `${formatNumber(data.meanRetirementAge, 0)} (in ${formatNumber(data.meanYearsToRetirement, 0)} years)`
      : '∞ (never retires)';

  const formattedMeanBankruptcyAge =
    data.meanBankruptcyAge !== -1 && data.meanYearsToBankruptcy !== -1
      ? `${formatNumber(data.meanBankruptcyAge, 0)} (in ${formatNumber(data.meanYearsToBankruptcy, 0)} years)`
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

        <DescriptionTerm>Mean Retirement Age</DescriptionTerm>
        <DescriptionDetails>{formattedMeanRetirementAge}</DescriptionDetails>

        <DescriptionTerm>Chance of Bankruptcy</DescriptionTerm>
        <DescriptionDetails>{`${formatNumber(data.chanceOfBankruptcy * 100, 1)}%`}</DescriptionDetails>

        <DescriptionTerm>Mean Bankruptcy Age</DescriptionTerm>
        <DescriptionDetails>{formattedMeanBankruptcyAge}</DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

interface MultiSimulationDataListSectionProps {
  chartData: MultiSimulationChartData;
  selectedAge: number;
}

function MultiSimulationDataListSection({ chartData, selectedAge }: MultiSimulationDataListSectionProps) {
  const resultsCategory = useResultsCategory();

  const props: DataListCardProps = { chartData, selectedAge };
  switch (resultsCategory) {
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
