'use client';

import { useState } from 'react';
import { ReceiptPercentIcon, ChartBarSquareIcon } from '@heroicons/react/20/solid';

import Card from '@/components/ui/card';
import ButtonGroup from '@/components/ui/button-group';

import StochasticPortfolioBarChart, { type StochasticPortfolioBarChartDataPoint } from '../../charts/legacy/stochastic-portfolio-bar-chart';

interface StochasticPortfolioBarChartCardProps {
  percentilesData: StochasticPortfolioBarChartDataPoint[];
  distributionData: StochasticPortfolioBarChartDataPoint[];
  selectedAge: number;
}

export default function StochasticPortfolioBarChartCard({
  percentilesData,
  distributionData,
  selectedAge,
}: StochasticPortfolioBarChartCardProps) {
  const [viewMode, setViewMode] = useState<'percentiles' | 'distribution'>('percentiles');

  let title = '';
  let rawChartData = [];

  switch (viewMode) {
    case 'percentiles':
      title = 'Percentiles';
      rawChartData = percentilesData;
      break;
    case 'distribution':
      title = 'Distribution';
      rawChartData = distributionData;
      break;
  }

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold">
          <span className="mr-2">Portfolio {title}</span>
          <span className="text-muted-foreground">Age {selectedAge}</span>
        </h4>
        <ButtonGroup
          firstButtonText="Percentiles"
          firstButtonIcon={<ReceiptPercentIcon />}
          firstButtonOnClick={() => setViewMode('percentiles')}
          lastButtonText="Distribution"
          lastButtonIcon={<ChartBarSquareIcon />}
          lastButtonOnClick={() => setViewMode('distribution')}
          defaultActiveButton="first"
        />
      </div>
      <StochasticPortfolioBarChart selectedAge={selectedAge} mode={viewMode} rawChartData={rawChartData} />
    </Card>
  );
}
