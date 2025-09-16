'use client';

import Card from '@/components/ui/card';
import type { SingleSimulationWithdrawalsChartDataPoint } from '@/lib/types/chart-data-points';

import SingleSimulationWithdrawalsBarChart from '../../charts/single-simulation/single-simulation-withdrawals-bar-chart';

interface SingleSimulationWithdrawalsBarChartCardProps {
  selectedAge: number;
  rawChartData: SingleSimulationWithdrawalsChartDataPoint[];
  dataView: 'annualAmounts' | 'totalAmounts' | 'taxTreatment' | 'custom';
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
      title = 'Annual Amounts';
      break;
    case 'totalAmounts':
      title = 'Total Amounts';
      break;
    case 'taxTreatment':
      title = 'By Tax Treatment';
      break;
    case 'custom':
      title = 'Custom Account';
      break;
  }

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold whitespace-nowrap">
          <span className="mr-2">{title}</span>
          <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
        </h4>
      </div>
      <SingleSimulationWithdrawalsBarChart age={selectedAge} rawChartData={rawChartData} dataView={dataView} customDataID={customDataID} />
    </Card>
  );
}
