'use client';

import { Fragment } from 'react';

import type { SingleSimulationPortfolioChartDataPoint } from '@/lib/types/chart-data-points';
import Card from '@/components/ui/card';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { formatNumber, formatChartString } from '@/lib/utils';

import SingleSimulationPortfolioPieChart from '../../charts/single-simulation/single-simulation-portfolio-pie-chart';

interface SingleSimulationPortfolioAssetTypePieChartCardProps {
  rawChartData: SingleSimulationPortfolioChartDataPoint[];
  selectedAge: number;
  dataView: 'assetClass' | 'taxTreatment' | 'custom';
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
            .filter(([name]) => ['stocks', 'bonds', 'cash'].includes(name))
            .map(([name, value]) => ({ name, value }))
        );
      break;
    case 'taxTreatment':
      title = 'By Tax Treatment';
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
                { name: 'stocks', value: totalValue * stocksAllocation },
                { name: 'bonds', value: totalValue * bondsAllocation },
                { name: 'cash', value: totalValue * cashAllocation },
              ];
            })
        );
      break;
  }

  const totalValue = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="grid grid-cols-1 gap-2 @3xl:grid-cols-2">
      <Card className="my-0">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-foreground flex items-center text-lg font-semibold">
            <span className="mr-2">{title}</span>
            <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
          </h4>
        </div>
        <SingleSimulationPortfolioPieChart chartData={chartData} />
      </Card>
      <Card className="my-0 hidden @3xl:block">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-foreground flex items-center text-lg font-semibold">
            <span className="mr-2">Net Worth</span>
            <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
          </h4>
        </div>
        <div className="flex h-64 w-full flex-col sm:h-72 lg:h-80">
          <DescriptionList>
            {chartData.map((entry, index) => (
              <Fragment key={entry.name}>
                <DescriptionTerm>{formatChartString(entry.name)}</DescriptionTerm>
                <DescriptionDetails>{formatNumber(entry.value, 2, '$')}</DescriptionDetails>
              </Fragment>
            ))}
            <DescriptionTerm className="font-bold">Total Value</DescriptionTerm>
            <DescriptionDetails className="font-bold">{formatNumber(totalValue, 2, '$')}</DescriptionDetails>
          </DescriptionList>
        </div>
      </Card>
    </div>
  );
}
