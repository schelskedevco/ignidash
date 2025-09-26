'use client';

import Card from '@/components/ui/card';
import type { SingleSimulationWithdrawalsChartDataPoint } from '@/lib/types/chart-data-points';
import { Subheading } from '@/components/catalyst/heading';

import SingleSimulationWithdrawalsBarChart from '../../charts/single-simulation/single-simulation-withdrawals-bar-chart';

interface SingleSimulationWithdrawalsBarChartCardProps {
  selectedAge: number;
  rawChartData: SingleSimulationWithdrawalsChartDataPoint[];
  dataView: 'annualAmounts' | 'totalAmounts' | 'taxCategory' | 'custom';
  customDataID: string;
}

export default function SingleSimulationWithdrawalsBarChartCard({
  selectedAge,
  rawChartData,
  dataView,
  customDataID,
}: SingleSimulationWithdrawalsBarChartCardProps) {
  let title;
  switch (dataView) {
    case 'annualAmounts':
      title = 'Annual Withdrawals';
      break;
    case 'totalAmounts':
      title = 'Total Withdrawals';
      break;
    case 'taxCategory':
      title = 'By Tax Category';
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
      <SingleSimulationWithdrawalsBarChart age={selectedAge} rawChartData={rawChartData} dataView={dataView} customDataID={customDataID} />
    </Card>
  );
}
