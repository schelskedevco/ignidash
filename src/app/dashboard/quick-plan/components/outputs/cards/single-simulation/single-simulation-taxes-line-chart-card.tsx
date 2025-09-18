'use client';

import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import type { SingleSimulationTaxesChartDataPoint } from '@/lib/types/chart-data-points';
import { useShowReferenceLines, type SingleSimulationKeyMetrics } from '@/lib/stores/quick-plan-store';

import SingleSimulationTaxesLineChart from '../../charts/single-simulation/single-simulation-taxes-line-chart';

interface SingleSimulationTaxesLineChartCardProps {
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  setDataView: (view: 'marginalRates' | 'effectiveRates' | 'taxAmounts' | 'netIncome' | 'taxableIncome') => void;
  dataView: 'marginalRates' | 'effectiveRates' | 'taxAmounts' | 'netIncome' | 'taxableIncome';
  rawChartData: SingleSimulationTaxesChartDataPoint[];
  keyMetrics: SingleSimulationKeyMetrics;
  startAge: number;
}

export default function SingleSimulationTaxesLineChartCard({
  onAgeSelect,
  selectedAge,
  setDataView,
  dataView,
  rawChartData,
  keyMetrics,
  startAge,
}: SingleSimulationTaxesLineChartCardProps) {
  const showReferenceLines = useShowReferenceLines();

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold whitespace-nowrap">
          <span className="mr-2">Taxes</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </h4>
        <Select
          className="max-w-48 sm:max-w-64"
          id="data-view"
          name="data-view"
          value={dataView}
          onChange={(e) => setDataView(e.target.value as 'marginalRates' | 'effectiveRates' | 'taxAmounts' | 'netIncome' | 'taxableIncome')}
        >
          <optgroup label="Tax Rates">
            <option value="marginalRates">Top Marginal Rates</option>
            <option value="effectiveRates">Effective Rates</option>
          </optgroup>
          <optgroup label="Dollar Amounts">
            <option value="taxAmounts">Tax Amounts</option>
            <option value="netIncome">Net Income After Tax</option>
            <option value="taxableIncome">Taxable Income</option>
          </optgroup>
        </Select>
      </div>
      <SingleSimulationTaxesLineChart
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
        rawChartData={rawChartData}
        keyMetrics={keyMetrics}
        showReferenceLines={showReferenceLines}
        dataView={dataView}
        startAge={startAge}
      />
    </Card>
  );
}
