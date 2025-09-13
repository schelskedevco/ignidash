'use client';

import type { SingleSimulationPortfolioChartDataPoint } from '@/lib/types/chart-data-points';
import Card from '@/components/ui/card';

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

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold">
          <span className="mr-2">{title}</span>
          <span className="text-muted-foreground">Age {selectedAge}</span>
        </h4>
      </div>
      <SingleSimulationPortfolioPieChart rawChartData={rawChartData} selectedAge={selectedAge} />
    </Card>
  );
}
