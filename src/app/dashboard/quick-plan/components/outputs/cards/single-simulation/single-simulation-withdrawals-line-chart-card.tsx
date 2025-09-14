'use client';

import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import type { SingleSimulationWithdrawalsChartDataPoint } from '@/lib/types/chart-data-points';

import SingleSimulationWithdrawalsLineChart from '../../charts/single-simulation/single-simulation-withdrawals-line-chart';

interface SingleSimulationWithdrawalsLineChartCardProps {
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  setDataView: (view: 'annualAmounts' | 'totalAmounts' | 'account') => void;
  dataView: 'annualAmounts' | 'totalAmounts' | 'account';
  rawChartData: SingleSimulationWithdrawalsChartDataPoint[];
  startAge: number;
}

export default function SingleSimulationWithdrawalsLineChartCard({
  onAgeSelect,
  selectedAge,
  setDataView,
  dataView,
  rawChartData,
  startAge,
}: SingleSimulationWithdrawalsLineChartCardProps) {
  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold whitespace-nowrap">
          <span className="mr-2">Withdrawals</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </h4>
        <Select
          className="max-w-64"
          id="data-view"
          name="data-view"
          value={dataView}
          onChange={(e) => setDataView(e.target.value as 'annualAmounts' | 'totalAmounts' | 'account')}
        >
          <option value="annualAmounts">Annual Amounts</option>
          <option value="totalAmounts">Total Amounts</option>
          <option value="account">Account Category</option>
        </Select>
      </div>
      <SingleSimulationWithdrawalsLineChart
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
        rawChartData={rawChartData}
        dataView={dataView}
        startAge={startAge}
      />
    </Card>
  );
}
