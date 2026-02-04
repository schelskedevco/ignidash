import Card from '@/components/ui/card';
import type { MultiSimulationPortfolioChartDataPoint } from '@/lib/types/chart-data-points';
import { Subheading } from '@/components/catalyst/heading';

import MultiSimulationPortfolioBarChart from '../../charts/multi-simulation/multi-simulation-portfolio-bar-chart';

interface MultiSimulationPortfolioBarChartCardProps {
  selectedAge: number;
  rawChartData: MultiSimulationPortfolioChartDataPoint[];
}

export default function MultiSimulationPortfolioBarChartCard({ selectedAge, rawChartData }: MultiSimulationPortfolioBarChartCardProps) {
  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <Subheading level={3}>
          <span className="mr-2">Portfolio Value Percentiles</span>
          <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
        </Subheading>
      </div>
      <MultiSimulationPortfolioBarChart age={selectedAge} rawChartData={rawChartData} />
    </Card>
  );
}
