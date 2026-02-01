'use client';

import { Fragment } from 'react';

import type { SingleSimulationNetWorthChartDataPoint } from '@/lib/types/chart-data-points';
import Card from '@/components/ui/card';
import { Subheading } from '@/components/catalyst/heading';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { formatChartString, formatNumber } from '@/lib/utils';
import { useAccountData, usePhysicalAssetData, useDebtData } from '@/hooks/use-convex-data';
import { taxCategoryFromAccountTypeForDisplay } from '@/lib/schemas/inputs/account-form-schema';

import SingleSimulationNetWorthPieChart from '../../charts/single-simulation/single-simulation-net-worth-pie-chart';
import SingleSimulationNetWorthBarChart from '../../charts/single-simulation/single-simulation-net-worth-bar-chart';

interface SingleSimulationNetWorthPieChartCardProps {
  rawChartData: SingleSimulationNetWorthChartDataPoint[];
  selectedAge: number;
  dataView: 'assetClass' | 'taxCategory' | 'netPortfolioChange' | 'netWorth' | 'netWorthChange' | 'custom';
  customDataID: string;
}

export default function SingleSimulationNetWorthPieChartCard({
  rawChartData,
  selectedAge,
  dataView,
  customDataID,
}: SingleSimulationNetWorthPieChartCardProps) {
  const accountData = useAccountData(customDataID !== '' ? customDataID : null);
  const physicalAssetData = usePhysicalAssetData(customDataID !== '' ? customDataID : null);
  const debtData = useDebtData(customDataID !== '' ? customDataID : null);

  let title = '';
  let chartData: { name: string; value: number }[] = [];
  let chartType: 'pie' | 'bar' = 'pie';

  let nameForTotalValue = 'Total Value';
  let totalValue = 0;
  let totalAbsoluteValue = 0;

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

      nameForTotalValue = 'Total Portfolio Value';
      totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
      totalAbsoluteValue = totalValue;
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

      nameForTotalValue = 'Total Portfolio Value';
      totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
      totalAbsoluteValue = totalValue;
      break;
    case 'netPortfolioChange':
      title = 'Net Portfolio Change';
      chartType = 'bar';
      break;
    case 'netWorth':
      title = 'Net Worth';

      chartData = rawChartData
        .filter((data) => data.age === selectedAge)
        .flatMap(({ stockHoldings, bondHoldings, cashHoldings, assetValue, debtBalance }) => [
          { name: 'stockHoldings', value: stockHoldings },
          { name: 'bondHoldings', value: bondHoldings },
          { name: 'cashHoldings', value: cashHoldings },
          { name: 'assetValue', value: assetValue },
          { name: 'debtBalance', value: debtBalance },
        ]);

      nameForTotalValue = 'Net Worth';
      totalValue = chartData.map(({ name, value }) => (name === 'debtBalance' ? -value : value)).reduce((sum, value) => sum + value, 0);
      totalAbsoluteValue = chartData.reduce((sum, item) => sum + item.value, 0);
      break;
    case 'netWorthChange':
      title = 'Net Worth Change';
      chartType = 'bar';
      break;
    case 'custom':
      const perAccountData = rawChartData
        .filter((data) => data.age === selectedAge)
        .flatMap(({ perAccountData }) => perAccountData.filter((account) => account.id === customDataID));
      if (perAccountData.length > 0) {
        title = accountData ? `${accountData.name} — ${taxCategoryFromAccountTypeForDisplay(accountData.type)}` : 'Custom Account';

        chartData = perAccountData.flatMap((account) => {
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
        });

        nameForTotalValue = 'Account Value';
        totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
        totalAbsoluteValue = totalValue;
        break;
      }

      const perAssetData = rawChartData
        .filter((data) => data.age === selectedAge)
        .flatMap(({ perAssetData }) => perAssetData.filter((asset) => asset.id === customDataID));
      if (perAssetData.length > 0) {
        title = physicalAssetData ? `${physicalAssetData.name} — Physical Asset` : 'Custom Physical Asset';

        chartData = perAssetData.flatMap((asset) => [
          { name: 'equity', value: asset.equity },
          { name: 'loanBalance', value: asset.loanBalance },
        ]);

        nameForTotalValue = 'Market Value';
        totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
        totalAbsoluteValue = totalValue;
        break;
      }

      const perDebtData = rawChartData
        .filter((data) => data.age === selectedAge)
        .flatMap(({ perDebtData }) => perDebtData.filter((debt) => debt.id === customDataID));
      if (perDebtData.length > 0) {
        title = debtData ? `${debtData.name} — Debt` : 'Custom Debt';

        chartData = perDebtData.flatMap((debt) => [{ name: 'balance', value: debt.balance }]);

        nameForTotalValue = 'Debt Balance';
        totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
        totalAbsoluteValue = totalValue;
        break;
      }

      break;
  }

  let chart = null;
  switch (chartType) {
    case 'pie':
      chart = (
        <div className="divide-border/25 flex h-full items-center pb-4 sm:divide-x">
          <div className="flex-1 sm:pr-6">
            <SingleSimulationNetWorthPieChart chartData={chartData} />
          </div>
          {totalAbsoluteValue > 0 && (
            <div className="hidden flex-1 sm:block sm:pl-6">
              <DescriptionList>
                {chartData.map(({ name, value }) => (
                  <Fragment key={name}>
                    <DescriptionTerm>{formatChartString(name)}</DescriptionTerm>
                    <DescriptionDetails>{`${formatNumber(value, 2, '$')} (${formatNumber((value / totalAbsoluteValue) * 100, 1)}%)`}</DescriptionDetails>
                  </Fragment>
                ))}
                <DescriptionTerm className="font-bold">{nameForTotalValue}</DescriptionTerm>
                <DescriptionDetails className="font-bold">{formatNumber(totalValue, 2, '$')}</DescriptionDetails>
              </DescriptionList>
            </div>
          )}
        </div>
      );
      break;
    case 'bar':
      chart = (
        <SingleSimulationNetWorthBarChart
          age={selectedAge}
          dataView={dataView as 'netPortfolioChange' | 'netWorthChange'}
          rawChartData={rawChartData}
        />
      );
      break;
  }

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <Subheading level={3}>
          <span className="mr-2">{title}</span>
          <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
        </Subheading>
      </div>
      {chart}
    </Card>
  );
}
