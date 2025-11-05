'use client';

import Card from '@/components/ui/card';
import type { SingleSimulationContributionsChartDataPoint } from '@/lib/types/chart-data-points';
import { Subheading } from '@/components/catalyst/heading';

import SingleSimulationContributionsBarChart from '../../charts/single-simulation/single-simulation-contributions-bar-chart';

interface SingleSimulationContributionsBarChartCardProps {
  selectedAge: number;
  rawChartData: SingleSimulationContributionsChartDataPoint[];
  dataView: 'annualAmounts' | 'cumulativeAmounts' | 'taxCategory' | 'custom' | 'employerMatch';
  customDataID: string;
}

export default function SingleSimulationContributionsBarChartCard({
  selectedAge,
  rawChartData,
  dataView,
  customDataID,
}: SingleSimulationContributionsBarChartCardProps) {
  let title;
  switch (dataView) {
    case 'annualAmounts':
      title = 'Annual Contributions';
      break;
    case 'cumulativeAmounts':
      title = 'Cumulative Contributions';
      break;
    case 'taxCategory':
      title = 'By Tax Category';
      break;
    case 'employerMatch':
      title = 'Employer Match';
      break;
    case 'custom':
      title = 'Custom Account';
      break;
  }

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <Subheading level={4}>
          <span className="mr-2">{title}</span>
          <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
        </Subheading>
      </div>
      <SingleSimulationContributionsBarChart
        age={selectedAge}
        rawChartData={rawChartData}
        dataView={dataView}
        customDataID={customDataID}
      />
    </Card>
  );
}
