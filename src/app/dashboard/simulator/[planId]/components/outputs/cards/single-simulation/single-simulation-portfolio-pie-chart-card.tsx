'use client';

import { Fragment } from 'react';

import type { SingleSimulationPortfolioChartDataPoint } from '@/lib/types/chart-data-points';
import Card from '@/components/ui/card';
import { Subheading } from '@/components/catalyst/heading';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { formatChartString, formatNumber } from '@/lib/utils';
import { useAccountData } from '@/hooks/use-convex-data';
import { taxCategoryFromAccountTypeForDisplay } from '@/lib/schemas/inputs/account-form-schema';

import SingleSimulationPortfolioPieChart from '../../charts/single-simulation/single-simulation-portfolio-pie-chart';
import SingleSimulationPortfolioBarChart from '../../charts/single-simulation/single-simulation-portfolio-bar-chart';

interface SingleSimulationPortfolioAssetTypePieChartCardProps {
  rawChartData: SingleSimulationPortfolioChartDataPoint[];
  selectedAge: number;
  dataView: 'assetClass' | 'taxCategory' | 'netChange' | 'custom';
  customDataID: string;
}

export default function SingleSimulationPortfolioAssetTypePieChartCard({
  rawChartData,
  selectedAge,
  dataView,
  customDataID,
}: SingleSimulationPortfolioAssetTypePieChartCardProps) {
  const accountData = useAccountData(customDataID !== '' ? customDataID : null);

  let title = '';
  let chartData: { name: string; value: number }[] = [];
  let useBarChart = false;
  switch (dataView) {
    case 'assetClass':
      title = 'By Asset Class';
      chartData = rawChartData
        .filter((data) => data.age === selectedAge)
        .flatMap(({ stockHoldings, bondHoldings, cashHoldings }) => [
          { name: 'stockHoldings', value: stockHoldings },
          { name: 'bondHoldings', value: bondHoldings },
          { name: 'cashHoldings', value: cashHoldings },
        ]);
      break;
    case 'taxCategory':
      title = 'By Tax Category';
      chartData = rawChartData
        .filter((data) => data.age === selectedAge)
        .flatMap(({ taxableValue, taxDeferredValue, taxFreeValue, cashSavings }) => [
          { name: 'taxableValue', value: taxableValue },
          { name: 'taxDeferredValue', value: taxDeferredValue },
          { name: 'taxFreeValue', value: taxFreeValue },
          { name: 'cashSavings', value: cashSavings },
        ]);
      break;
    case 'netChange':
      title = 'Net Portfolio Change';
      useBarChart = true;
      break;
    case 'custom':
      title = accountData ? `${accountData.name} — ${taxCategoryFromAccountTypeForDisplay(accountData.type)}` : 'Custom Account';
      chartData = rawChartData
        .filter((data) => data.age === selectedAge)
        .flatMap(({ perAccountData }) =>
          perAccountData
            .filter((account) => account.id === customDataID)
            .flatMap((account) => {
              const balance = account.balance;

              const assetAllocation = account.assetAllocation ?? { stocks: 0, bonds: 0, cash: 0 };
              const stocksAllocation = assetAllocation.stocks;
              const bondsAllocation = assetAllocation.bonds;
              const cashAllocation = assetAllocation.cash;

              return [
                { name: 'stockHoldings', value: balance * stocksAllocation },
                { name: 'bondHoldings', value: balance * bondsAllocation },
                { name: 'cashHoldings', value: balance * cashAllocation },
              ];
            })
        );
      break;
  }

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <Subheading level={3}>
          <span className="mr-2">{title}</span>
          <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
        </Subheading>
      </div>
      {useBarChart ? (
        <SingleSimulationPortfolioBarChart age={selectedAge} dataView="netChange" rawChartData={rawChartData} />
      ) : (
        <div className="divide-border/25 flex h-full items-center pb-4 sm:divide-x">
          <div className="flex-1 sm:pr-6">
            <SingleSimulationPortfolioPieChart chartData={chartData} />
          </div>
          {totalValue > 0 && (
            <div className="hidden flex-1 sm:block sm:pl-6">
              <DescriptionList>
                {chartData.map(({ name, value }) => (
                  <Fragment key={name}>
                    <DescriptionTerm>{formatChartString(name)}</DescriptionTerm>
                    <DescriptionDetails>{`${formatNumber(value, 2, '$')} (${formatNumber((value / totalValue) * 100, 1)}%)`}</DescriptionDetails>
                  </Fragment>
                ))}
                <DescriptionTerm className="font-bold">Total Portfolio Value</DescriptionTerm>
                <DescriptionDetails className="font-bold">{formatNumber(totalValue, 2, '$')}</DescriptionDetails>
              </DescriptionList>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
