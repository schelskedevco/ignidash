'use client';

import { Fragment } from 'react';

import type { SingleSimulationPortfolioChartDataPoint } from '@/lib/types/chart-data-points';
import Card from '@/components/ui/card';
import { Subheading } from '@/components/catalyst/heading';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { formatChartString, formatNumber } from '@/lib/utils';

import SingleSimulationPortfolioPieChart from '../../charts/single-simulation/single-simulation-portfolio-pie-chart';

interface SingleSimulationPortfolioAssetTypePieChartCardProps {
  rawChartData: SingleSimulationPortfolioChartDataPoint[];
  selectedAge: number;
  dataView: 'assetClass' | 'taxCategory' | 'custom';
  customDataID: string;
}

export default function SingleSimulationPortfolioAssetTypePieChartCard({
  rawChartData,
  selectedAge,
  dataView,
  customDataID,
}: SingleSimulationPortfolioAssetTypePieChartCardProps) {
  let title = '';

  let chartData: { name: string; value: number }[] = [];
  switch (dataView) {
    case 'assetClass':
      title = 'By Asset Class';
      chartData = rawChartData
        .filter((data) => data.age === selectedAge)
        .flatMap(({ age, perAccountData, ...rest }) =>
          Object.entries(rest)
            .filter(([name]) => ['stockHoldings', 'bondHoldings', 'cashHoldings'].includes(name))
            .map(([name, value]) => ({ name, value }))
        );
      break;
    case 'taxCategory':
      title = 'By Tax Category';
      chartData = rawChartData
        .filter((data) => data.age === selectedAge)
        .flatMap(({ age, perAccountData, ...rest }) =>
          Object.entries(rest)
            .filter(([name]) => ['taxableBrokerage', 'taxDeferred', 'taxFree', 'cashSavings'].includes(name))
            .map(([name, value]) => ({ name, value }))
        );
      break;
    case 'custom':
      title = 'Custom Account';
      chartData = rawChartData
        .filter((data) => data.age === selectedAge)
        .flatMap(({ age, perAccountData }) =>
          perAccountData
            .filter((account) => account.id === customDataID)
            .flatMap((account) => {
              const totalValue = account.totalValue;

              const assetAllocation = account.assetAllocation ?? { stocks: 0, bonds: 0, cash: 0 };
              const stocksAllocation = assetAllocation.stocks;
              const bondsAllocation = assetAllocation.bonds;
              const cashAllocation = assetAllocation.cash;

              return [
                { name: 'stockHoldings', value: totalValue * stocksAllocation },
                { name: 'bondHoldings', value: totalValue * bondsAllocation },
                { name: 'cashHoldings', value: totalValue * cashAllocation },
              ];
            })
        );
      break;
  }

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <Subheading level={4}>
          <span className="mr-2">{title}</span>
          <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
        </Subheading>
      </div>
      <div className="divide-border/25 flex h-full items-center divide-x py-4">
        <div className="flex-1 pr-4">
          <SingleSimulationPortfolioPieChart chartData={chartData} />
        </div>
        {totalValue > 0 && (
          <div className="hidden flex-1 pl-4 sm:block">
            <DescriptionList>
              {chartData.map(({ name, value }) => (
                <Fragment key={name}>
                  <DescriptionTerm>{formatChartString(name)}</DescriptionTerm>
                  <DescriptionDetails>{`${formatNumber(value, 2, '$')} (${formatNumber((value / totalValue) * 100, 1)}%)`}</DescriptionDetails>
                </Fragment>
              ))}
              <DescriptionTerm className="font-bold">Total</DescriptionTerm>
              <DescriptionDetails className="font-bold">{formatNumber(totalValue, 2, '$')}</DescriptionDetails>
            </DescriptionList>
          </div>
        )}
      </div>
    </Card>
  );
}
