'use client';

import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import type { SingleSimulationTaxesChartDataPoint } from '@/lib/types/chart-data-points';
import { useShowReferenceLines } from '@/lib/stores/quick-plan-store';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import { Subheading } from '@/components/catalyst/heading';

import SingleSimulationTaxesLineChart from '../../charts/single-simulation/single-simulation-taxes-line-chart';

interface SingleSimulationTaxesLineChartCardProps {
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  setDataView: (view: 'marginalRates' | 'effectiveRates' | 'annualAmounts' | 'cumulativeAmounts' | 'netIncome' | 'taxableIncome') => void;
  dataView: 'marginalRates' | 'effectiveRates' | 'annualAmounts' | 'cumulativeAmounts' | 'netIncome' | 'taxableIncome';
  rawChartData: SingleSimulationTaxesChartDataPoint[];
  keyMetrics: KeyMetrics;
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
        <Subheading level={4}>
          <span className="mr-2">Taxes</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </Subheading>
        <Select
          className="max-w-48 sm:max-w-64"
          id="taxes-data-view"
          name="taxes-data-view"
          value={dataView}
          onChange={(e) =>
            setDataView(
              e.target.value as 'marginalRates' | 'effectiveRates' | 'annualAmounts' | 'cumulativeAmounts' | 'netIncome' | 'taxableIncome'
            )
          }
        >
          <optgroup label="Tax Rates">
            <option value="marginalRates">Top Marginal Rates</option>
            <option value="effectiveRates">Effective Rates</option>
          </optgroup>
          <optgroup label="Tax Amounts">
            <option value="taxableIncome">Taxable Income</option>
            <option value="netIncome">Net Income After Tax</option>
            <option value="annualAmounts">Annual Taxes</option>
            <option value="cumulativeAmounts">Cumulative Taxes</option>
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
