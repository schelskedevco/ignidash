'use client';

import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import type { SingleSimulationTaxesChartDataPoint } from '@/lib/types/chart-data-points';

import SingleSimulationTaxesLineChart from '../../charts/single-simulation/single-simulation-taxes-line-chart';

interface SingleSimulationTaxesLineChartCardProps {
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  setDataView: (view: 'marginalRates' | 'effectiveRates' | 'amounts' | 'net' | 'taxableIncome') => void;
  dataView: 'marginalRates' | 'effectiveRates' | 'amounts' | 'net' | 'taxableIncome';
  rawChartData: SingleSimulationTaxesChartDataPoint[];
  startAge: number;
}

export default function SingleSimulationTaxesLineChartCard({
  onAgeSelect,
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
          className="max-w-64"
          id="data-view"
          name="data-view"
          value={dataView}
          onChange={(e) => setDataView(e.target.value as 'marginalRates' | 'effectiveRates' | 'amounts' | 'net' | 'taxableIncome')}
        >
          <option value="marginalRates">Marginal Rates</option>
          <option value="effectiveRates">Effective Rates</option>
          <option value="amounts">Taxes Due</option>
          <option value="net">Net After Tax</option>
          <option value="taxableIncome">Taxable Income</option>
        </Select>
      </div>
      <SingleSimulationTaxesLineChart
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
        rawChartData={rawChartData}
        dataView={dataView}
        startAge={startAge}
      />
    </Card>
  );
}
