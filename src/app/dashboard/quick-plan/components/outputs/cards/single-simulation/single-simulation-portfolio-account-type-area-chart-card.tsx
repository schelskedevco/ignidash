'use client';

import { useShowReferenceLinesPreference, /* useUpdatePreferences */ type FixedReturnsKeyMetricsV2 } from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';
// import { Switch } from '@/components/catalyst/switch';
import { Select } from '@/components/catalyst/select';

import SingleSimulationPortfolioAccountTypeAreaChart, {
  type SingleSimulationPortfolioAccountTypeAreaChartDataPoint,
} from '../../charts/single-simulation/single-simulation-portfolio-account-type-area-chart';

interface SingleSimulationPortfolioAccountTypeAreaChartCardProps {
  rawChartData: SingleSimulationPortfolioAccountTypeAreaChartDataPoint[];
  keyMetrics: FixedReturnsKeyMetricsV2;
  setSelectedAge: (age: number) => void;
  selectedAge: number;
  setDataView: (view: 'asset' | 'account') => void;
  dataView: 'asset' | 'account';
  startAge: number;
}

export default function SingleSimulationPortfolioAccountTypeAreaChartCard({
  rawChartData,
  keyMetrics,
  setSelectedAge,
  selectedAge,
  setDataView,
  dataView,
  startAge,
}: SingleSimulationPortfolioAccountTypeAreaChartCardProps) {
  const showReferenceLines = useShowReferenceLinesPreference();
  // const updatePreferences = useUpdatePreferences();

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold whitespace-nowrap">
          <span className="mr-2">Net Worth</span>
          <span className="text-muted-foreground">Time Series</span>
        </h4>
        <Select
          className="max-w-40"
          id="data-view"
          name="data-view"
          value={dataView}
          onChange={(e) => setDataView(e.target.value as 'asset' | 'account')}
        >
          <option value="asset">Asset Class</option>
          <option value="account">Account Type</option>
        </Select>
        {/* <Switch
          className="focus-outline"
          color="rose"
          checked={showReferenceLines}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updatePreferences('showReferenceLines', !showReferenceLines);
          }}
          onChange={() => updatePreferences('showReferenceLines', !showReferenceLines)}
          aria-label="Toggle reference lines"
        /> */}
      </div>
      <SingleSimulationPortfolioAccountTypeAreaChart
        rawChartData={rawChartData}
        startAge={startAge}
        keyMetrics={keyMetrics}
        showReferenceLines={showReferenceLines}
        onAgeSelect={(age) => {
          if (age >= startAge + 1) setSelectedAge(age);
        }}
        selectedAge={selectedAge}
      />
    </Card>
  );
}
