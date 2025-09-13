'use client';

import { useTheme } from 'next-themes';
import { Fragment } from 'react';

import type { SingleSimulationPortfolioChartDataPoint } from '@/lib/types/chart-data-points';
import Card from '@/components/ui/card';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { formatNumber, formatChartString } from '@/lib/utils';

import SingleSimulationPortfolioPieChart from '../../charts/single-simulation/single-simulation-portfolio-pie-chart';

const COLORS = ['var(--chart-3)', 'var(--chart-2)', 'var(--chart-1)', 'var(--chart-4)'];

interface SingleSimulationPortfolioAssetTypePieChartCardProps {
  rawChartData: SingleSimulationPortfolioChartDataPoint[];
  selectedAge: number;
  dataView: 'assetClass' | 'taxTreatment';
}

export default function SingleSimulationPortfolioAssetTypePieChartCard({
  rawChartData,
  selectedAge,
  dataView,
}: SingleSimulationPortfolioAssetTypePieChartCardProps) {
  let title = '';
  switch (dataView) {
    case 'assetClass':
      title = 'By Asset Class';
      break;
    case 'taxTreatment':
      title = 'By Tax Treatment';
      break;
  }

  const chartData = rawChartData
    .filter((data) => data.age === selectedAge)
    .flatMap(({ age, ...rest }) => {
      const dataKeys: (keyof SingleSimulationPortfolioChartDataPoint)[] = [];
      switch (dataView) {
        case 'assetClass':
          dataKeys.push('stocks', 'bonds', 'cash');
          break;
        case 'taxTreatment':
          dataKeys.push('taxable', 'taxDeferred', 'taxFree', 'cashSavings');
          break;
      }

      return Object.entries(rest)
        .filter(([name]) => dataKeys.includes(name as keyof SingleSimulationPortfolioChartDataPoint))
        .map(([name, value]) => ({ name, value }));
    });

  const totalValue = chartData.reduce((acc, curr) => acc + curr.value, 0);

  const { resolvedTheme } = useTheme();
  const legendStrokeColor = resolvedTheme === 'dark' ? 'white' : 'black';

  return (
    <div className="grid grid-cols-1 gap-2 @5xl:grid-cols-3">
      <Card className="my-0 @5xl:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-foreground flex items-center text-lg font-semibold">
            <span className="mr-2">{title}</span>
            <span className="text-muted-foreground">Age {selectedAge}</span>
          </h4>
        </div>
        <SingleSimulationPortfolioPieChart chartData={chartData} selectedAge={selectedAge} dataView={dataView} />
      </Card>
      <Card className="my-0 hidden @5xl:block">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-foreground flex items-center text-lg font-semibold">
            <span className="mr-2">Net Worth</span>
            <span className="text-muted-foreground">{formatNumber(totalValue, 2, '$')}</span>
          </h4>
        </div>
        <div className="flex h-64 w-full flex-col justify-center sm:h-72 lg:h-80">
          <DescriptionList>
            {chartData.map((entry, index) => (
              <Fragment key={entry.name}>
                <DescriptionTerm className="flex items-center gap-1">
                  <svg viewBox="0 0 6 6" aria-hidden="true" className={`size-5 fill-[${COLORS[index % COLORS.length]}]`}>
                    <circle r={2.5} cx={3} cy={3} stroke={legendStrokeColor} strokeWidth={0.5} paintOrder="stroke" />
                  </svg>
                  {formatChartString(entry.name)}
                </DescriptionTerm>
                <DescriptionDetails>{formatNumber(entry.value, 2, '$')}</DescriptionDetails>
              </Fragment>
            ))}
          </DescriptionList>
        </div>
      </Card>
    </div>
  );
}
