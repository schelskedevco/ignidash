'use client';

import Card from '@/components/ui/card';
import type { SingleSimulationWithdrawalsChartDataPoint } from '@/lib/types/chart-data-points';
import type { WithdrawalsDataView } from '@/lib/types/chart-data-views';
import { Subheading } from '@/components/catalyst/heading';
import { useAccountData } from '@/hooks/use-convex-data';
import { taxCategoryFromAccountTypeForDisplay } from '@/lib/schemas/inputs/account-form-schema';

import SingleSimulationWithdrawalsBarChart from '../../charts/single-simulation/single-simulation-withdrawals-bar-chart';

interface SingleSimulationWithdrawalsBarChartCardProps {
  selectedAge: number;
  rawChartData: SingleSimulationWithdrawalsChartDataPoint[];
  dataView: WithdrawalsDataView;
  customDataID: string;
}

export default function SingleSimulationWithdrawalsBarChartCard({
  selectedAge,
  rawChartData,
  dataView,
  customDataID,
}: SingleSimulationWithdrawalsBarChartCardProps) {
  const accountData = useAccountData(customDataID !== '' ? customDataID : null);

  let title;
  switch (dataView) {
    case 'annualAmounts':
      title = 'Annual Withdrawals';
      break;
    case 'cumulativeAmounts':
      title = 'Cumulative Withdrawals';
      break;
    case 'taxCategory':
      title = 'By Tax Category';
      break;
    case 'realizedGains':
      title = 'Realized Gains';
      break;
    case 'requiredMinimumDistributions':
      title = 'Required Minimum Distributions';
      break;
    case 'earlyWithdrawals':
      title = 'Early Withdrawals';
      break;
    case 'shortfall':
      title = 'Shortfall';
      break;
    case 'withdrawalRate':
      title = 'Withdrawal Rate';
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
      <SingleSimulationWithdrawalsBarChart age={selectedAge} rawChartData={rawChartData} dataView={dataView} customDataID={customDataID} />
    </Card>
  );
}
