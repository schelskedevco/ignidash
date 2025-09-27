'use client';

import Card from '@/components/ui/card';
import type { SingleSimulationTaxesChartDataPoint } from '@/lib/types/chart-data-points';
import { Subheading } from '@/components/catalyst/heading';

import SingleSimulationTaxesBarChart from '../../charts/single-simulation/single-simulation-taxes-bar-chart';

interface SingleSimulationTaxesBarChartCardProps {
  selectedAge: number;
  rawChartData: SingleSimulationTaxesChartDataPoint[];
  dataView: 'marginalRates' | 'effectiveRates' | 'taxAmounts' | 'netIncome' | 'taxableIncome';
}

export default function SingleSimulationTaxesBarChartCard({ selectedAge, rawChartData, dataView }: SingleSimulationTaxesBarChartCardProps) {
  let title;
  switch (dataView) {
    case 'marginalRates':
      title = 'Top Marginal Rates';
      break;
    case 'effectiveRates':
      title = 'Effective Rates';
      break;
    case 'taxAmounts':
      title = 'Taxes Due';
      break;
    case 'netIncome':
      title = 'Net After Tax';
      break;
    case 'taxableIncome':
      title = 'Taxable Income';
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
      <SingleSimulationTaxesBarChart age={selectedAge} rawChartData={rawChartData} dataView={dataView} />
    </Card>
  );
}
