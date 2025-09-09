'use client';

import { useCurrentAge } from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';
import type { StochasticWithdrawalsChartDataPoint } from '@/lib/types/chart-data-points';

import StochasticWithdrawalsLineChart from '../../charts/legacy/stochastic-withdrawals-line-chart';

interface StochasticWithdrawalsLineChartCardProps {
  setSelectedAge: (age: number) => void;
  selectedAge: number;
  rawChartData: StochasticWithdrawalsChartDataPoint[];
}

export default function StochasticWithdrawalsLineChartCard({
  setSelectedAge,
  selectedAge,
  rawChartData,
}: StochasticWithdrawalsLineChartCardProps) {
  const currentAge = useCurrentAge();

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold">
          <span className="mr-2">Withdrawal Rate</span>
          <span className="text-muted-foreground">Time Series</span>
        </h4>
      </div>
      <StochasticWithdrawalsLineChart
        onAgeSelect={(age) => {
          if (age >= currentAge! + 1) setSelectedAge(age);
        }}
        selectedAge={selectedAge}
        rawChartData={rawChartData}
      />
    </Card>
  );
}
