'use client';

import Card from '@/components/ui/card';
import type { SingleSimulationReturnsChartDataPoint } from '@/lib/types/chart-data-points';
import { Subheading } from '@/components/catalyst/heading';
import { useAccountData } from '@/hooks/use-convex-data';
import { taxCategoryFromAccountTypeForDisplay } from '@/lib/schemas/inputs/account-form-schema';

import SingleSimulationReturnsBarChart from '../../charts/single-simulation/single-simulation-returns-bar-chart';

interface SingleSimulationReturnsBarChartCardProps {
  selectedAge: number;
  rawChartData: SingleSimulationReturnsChartDataPoint[];
  dataView: 'rates' | 'annualAmounts' | 'cumulativeAmounts' | 'taxCategory' | 'custom';
  customDataID: string;
}

export default function SingleSimulationReturnsBarChartCard({
  selectedAge,
  rawChartData,
  dataView,
  customDataID,
}: SingleSimulationReturnsBarChartCardProps) {
  const accountData = useAccountData(customDataID !== '' ? customDataID : null);

  let title;
  switch (dataView) {
    case 'rates':
      title = 'Real Returns';
      break;
    case 'annualAmounts':
      title = 'Annual Growth';
      break;
    case 'cumulativeAmounts':
      title = 'Cumulative Growth';
      break;
    case 'taxCategory':
      title = 'By Tax Category';
      break;
    case 'custom':
      title = accountData ? `${accountData.name} — ${taxCategoryFromAccountTypeForDisplay(accountData.type)}` : 'Custom Account';
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
      <SingleSimulationReturnsBarChart age={selectedAge} rawChartData={rawChartData} dataView={dataView} customDataID={customDataID} />
    </Card>
  );
}
