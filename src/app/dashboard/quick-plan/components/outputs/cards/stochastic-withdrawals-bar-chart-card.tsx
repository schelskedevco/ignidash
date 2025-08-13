'use client';

import { useState } from 'react';
import { ReceiptPercentIcon, DocumentCurrencyDollarIcon } from '@heroicons/react/20/solid';

import Card from '@/components/ui/card';
import ButtonGroup from '@/components/ui/button-group';
import type { StochasticWithdrawalsChartDataPoint } from '@/lib/types/chart-data-points';

import StochasticWithdrawalsBarChart from '../charts/stochastic-withdrawals-bar-chart';

interface StochasticWithdrawalsBarChartCardProps {
  selectedAge: number;
  rawChartData: StochasticWithdrawalsChartDataPoint[];
}

export default function StochasticWithdrawalsBarChartCard({ selectedAge, rawChartData }: StochasticWithdrawalsBarChartCardProps) {
  const [viewMode, setViewMode] = useState<'amounts' | 'rates'>('rates');

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold">
          <span className="mr-2">Withdrawals</span>
          <span className="text-muted-foreground">Age {selectedAge}</span>
        </h4>
        <ButtonGroup
          firstButtonText="Rates"
          firstButtonIcon={<ReceiptPercentIcon />}
          firstButtonOnClick={() => setViewMode('rates')}
          lastButtonText="Amounts"
          lastButtonIcon={<DocumentCurrencyDollarIcon />}
          lastButtonOnClick={() => setViewMode('amounts')}
          defaultActiveButton="first"
        />
      </div>
      <StochasticWithdrawalsBarChart age={selectedAge} mode={viewMode} rawChartData={rawChartData} />
    </Card>
  );
}
