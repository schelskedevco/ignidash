'use client';

import { Fragment } from 'react';

import type { SingleSimulationPortfolioChartDataPoint } from '@/lib/types/chart-data-points';
import Card from '@/components/ui/card';
import { Subheading } from '@/components/catalyst/heading';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { formatNumber, formatChartString } from '@/lib/utils';

import SingleSimulationPortfolioPieChart from '../../charts/single-simulation/single-simulation-portfolio-pie-chart';

interface SingleSimulationPortfolioAssetTypePieChartCardProps {
  rawChartData: SingleSimulationPortfolioChartDataPoint[];
  selectedAge: number;
  dataView: 'asset' | 'account';
}

export default function SingleSimulationPortfolioAssetTypePieChartCard({
  rawChartData,
  selectedAge,
  dataView,
}: SingleSimulationPortfolioAssetTypePieChartCardProps) {
  let title = '';
  switch (dataView) {
    case 'asset':
      title = 'By Asset Class';
      break;
    case 'account':
      title = 'By Account Category';
      break;
  }

  const chartData = rawChartData
    .filter((data) => data.age === selectedAge)
    .flatMap(({ age, ...rest }) => {
      const dataKeys: (keyof SingleSimulationPortfolioChartDataPoint)[] = [];
      switch (dataView) {
        case 'asset':
          dataKeys.push('stocks', 'bonds', 'cash');
          break;
        case 'account':
          dataKeys.push('taxable', 'taxDeferred', 'taxFree', 'savings');
          break;
      }

      return Object.entries(rest)
        .filter(([name]) => dataKeys.includes(name as keyof SingleSimulationPortfolioChartDataPoint))
        .map(([name, value]) => ({ name, value }));
    });

  const totalValue = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <>
      <Card className="my-0">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-foreground flex items-center text-lg font-semibold">
            <span className="mr-2">{title}</span>
            <span className="text-muted-foreground">Age {selectedAge}</span>
          </h4>
        </div>
        <SingleSimulationPortfolioPieChart chartData={chartData} selectedAge={selectedAge} dataView={dataView} />
      </Card>
      <Card className="my-0">
        <DescriptionList>
          <Subheading level={5} className="mb-2 whitespace-nowrap">
            {`Net Worth | ${formatNumber(totalValue, 2, '$')}`}
          </Subheading>
          {chartData.toReversed().map((entry) => (
            <Fragment key={entry.name}>
              <DescriptionTerm>{formatChartString(entry.name)}</DescriptionTerm>
              <DescriptionDetails>{formatNumber(entry.value, 2, '$')}</DescriptionDetails>
            </Fragment>
          ))}
        </DescriptionList>
      </Card>
    </>
  );
}
