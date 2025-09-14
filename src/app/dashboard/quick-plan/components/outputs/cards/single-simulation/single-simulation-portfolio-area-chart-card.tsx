'use client';

import { useMemo, useCallback } from 'react';

import { useShowReferenceLinesPreference, type FixedReturnsKeyMetricsV2 } from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import type { SingleSimulationPortfolioChartDataPoint } from '@/lib/types/chart-data-points';

import SingleSimulationPortfolioAreaChart from '../../charts/single-simulation/single-simulation-portfolio-area-chart';

interface SingleSimulationPortfolioAssetTypeAreaChartCardProps {
  rawChartData: SingleSimulationPortfolioChartDataPoint[];
  keyMetrics: FixedReturnsKeyMetricsV2;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  setDataView: (view: 'assetClass' | 'taxTreatment' | 'custom') => void;
  dataView: 'assetClass' | 'taxTreatment' | 'custom';
  setCustomDataID: (name: string) => void;
  customDataID: string;
  startAge: number;
}

export default function SingleSimulationPortfolioAssetTypeAreaChartCard({
  rawChartData,
  keyMetrics,
  onAgeSelect,
  selectedAge,
  setDataView,
  dataView,
  setCustomDataID,
  customDataID,
  startAge,
}: SingleSimulationPortfolioAssetTypeAreaChartCardProps) {
  const showReferenceLines = useShowReferenceLinesPreference();

  const getUniqueItems = useCallback((items: Array<{ id: string; name: string }>) => {
    return Array.from(new Map(items.map((item) => [item.id, { id: item.id, name: item.name }])).values());
  }, []);

  const uniqueAccounts = useMemo(
    () => getUniqueItems(rawChartData.flatMap((dataPoint) => dataPoint.perAccountData)),
    [getUniqueItems, rawChartData]
  );

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold whitespace-nowrap">
          <span className="mr-2">Portfolio</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </h4>
        <Select
          className="max-w-64"
          id="data-view"
          name="data-view"
          value={dataView === 'custom' ? customDataID : dataView}
          onChange={(e) => {
            const isCustomSelection = e.target.value !== 'assetClass' && e.target.value !== 'taxTreatment';
            if (isCustomSelection) {
              setDataView('custom');
              setCustomDataID(e.target.value);
            } else {
              setDataView(e.target.value as 'assetClass' | 'taxTreatment' | 'custom');
              setCustomDataID('');
            }
          }}
        >
          <optgroup label="By Category">
            <option value="assetClass">Asset Class</option>
            <option value="taxTreatment">Tax Treatment</option>
          </optgroup>
          <optgroup label="By Account">
            {uniqueAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </optgroup>
        </Select>
      </div>
      <SingleSimulationPortfolioAreaChart
        rawChartData={rawChartData}
        startAge={startAge}
        keyMetrics={keyMetrics}
        showReferenceLines={showReferenceLines}
        dataView={dataView}
        customDataID={customDataID}
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
      />
    </Card>
  );
}
