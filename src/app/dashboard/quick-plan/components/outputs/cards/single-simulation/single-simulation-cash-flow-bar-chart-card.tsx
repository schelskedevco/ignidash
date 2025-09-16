'use client';

import Card from '@/components/ui/card';
import type { SingleSimulationCashFlowChartDataPoint } from '@/lib/types/chart-data-points';

import SingleSimulationCashFlowBarChart from '../../charts/single-simulation/single-simulation-cash-flow-bar-chart';

interface SingleSimulationCashFlowBarChartCardProps {
  selectedAge: number;
  rawChartData: SingleSimulationCashFlowChartDataPoint[];
  dataView: 'net' | 'incomes' | 'expenses' | 'custom';
  customDataID: string;
}

export default function SingleSimulationCashFlowBarChartCard({
  selectedAge,
  rawChartData,
  dataView,
  customDataID,
}: SingleSimulationCashFlowBarChartCardProps) {
  let title;
  switch (dataView) {
    case 'net':
      title = 'Cash Flow';
      break;
    case 'incomes':
      title = 'All Incomes';
      break;
    case 'expenses':
      title = 'All Expenses';
      break;
    case 'custom':
      title = 'Custom';
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
      <SingleSimulationCashFlowBarChart age={selectedAge} rawChartData={rawChartData} dataView={dataView} customDataID={customDataID} />
    </Card>
  );
}
