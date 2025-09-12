'use client';

import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import type { SingleSimulationTaxesChartDataPoint } from '@/lib/types/chart-data-points';

import SingleSimulationTaxesLineChart from '../../charts/single-simulation/single-simulation-taxes-line-chart';

interface SingleSimulationTaxesLineChartCardProps {
  setSelectedAge: (age: number) => void;
  selectedAge: number;
  setDataView: (view: 'marginalRates' | 'effectiveRates' | 'amounts' | 'net') => void;
  dataView: 'marginalRates' | 'effectiveRates' | 'amounts' | 'net';
  rawChartData: SingleSimulationTaxesChartDataPoint[];
  startAge: number;
}

export default function SingleSimulationTaxesLineChartCard({
  setSelectedAge,
  selectedAge,
  setDataView,
  dataView,
  rawChartData,
  startAge,
}: SingleSimulationTaxesLineChartCardProps) {
  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold whitespace-nowrap">
          <span className="mr-2">Taxes</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </h4>
        <Select
          className="max-w-48"
          id="data-view"
          name="data-view"
          value={dataView}
          onChange={(e) => setDataView(e.target.value as 'marginalRates' | 'effectiveRates' | 'amounts' | 'net')}
        >
          <option value="marginalRates">Marginal Rates</option>
          <option value="effectiveRates">Effective Rates</option>
          <option value="amounts">Amounts</option>
          <option value="net">Net After Tax</option>
        </Select>
      </div>
      <SingleSimulationTaxesLineChart
        onAgeSelect={(age) => {
          if (age >= startAge + 1) setSelectedAge(age);
        }}
        selectedAge={selectedAge}
        rawChartData={rawChartData}
        dataView={dataView}
      />
    </Card>
  );
}
