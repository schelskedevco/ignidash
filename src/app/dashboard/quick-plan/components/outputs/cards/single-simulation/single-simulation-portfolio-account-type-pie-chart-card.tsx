'use client';

import Card from '@/components/ui/card';

import SingleSimulationPortfolioPieChart from '../../charts/single-simulation/single-simulation-portfolio-pie-chart';
import type { SingleSimulationPortfolioAccountTypeAreaChartDataPoint } from '../../charts/single-simulation/single-simulation-portfolio-account-type-area-chart';

interface SingleSimulationPortfolioAccountTypePieChartCardProps {
  rawChartData: SingleSimulationPortfolioAccountTypeAreaChartDataPoint[];
  selectedAge: number;
}

export default function SingleSimulationPortfolioAccountTypePieChartCard({
  rawChartData,
  selectedAge,
}: SingleSimulationPortfolioAccountTypePieChartCardProps) {
  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold">
          <span className="mr-2">By Account Category</span>
          <span className="text-muted-foreground">Age {selectedAge}</span>
        </h4>
      </div>
      <SingleSimulationPortfolioPieChart rawChartData={rawChartData} selectedAge={selectedAge} />
    </Card>
  );
}
