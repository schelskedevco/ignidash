'use client';

import { useMemo, useCallback } from 'react';

import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import type { SingleSimulationReturnsChartDataPoint } from '@/lib/types/chart-data-points';
import type { ReturnsDataView } from '@/lib/types/chart-data-views';
import { useShowReferenceLines } from '@/lib/stores/simulator-store';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import { Subheading } from '@/components/catalyst/heading';

import SingleSimulationReturnsLineChart from '../../charts/single-simulation/single-simulation-returns-line-chart';
import ChartTimeFrameDropdown from '../../chart-time-frame-dropdown';

interface SingleSimulationReturnsLineChartCardProps {
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  setDataView: (view: ReturnsDataView) => void;
  dataView: ReturnsDataView;
  rawChartData: SingleSimulationReturnsChartDataPoint[];
  keyMetrics: KeyMetrics;
  startAge: number;
  setCustomDataID: (name: string) => void;
  customDataID: string;
}

export default function SingleSimulationReturnsLineChartCard({
  onAgeSelect,
  selectedAge,
  setDataView,
  dataView,
  rawChartData,
  keyMetrics,
  startAge,
  setCustomDataID,
  customDataID,
}: SingleSimulationReturnsLineChartCardProps) {
  const showReferenceLines = useShowReferenceLines();

  const getUniqueItems = useCallback((items: Array<{ id: string; name: string }>) => {
    return Array.from(new Map(items.map((item) => [item.id, { id: item.id, name: item.name }])).values());
  }, []);

  const uniqueAccounts = useMemo(
    () => getUniqueItems(rawChartData.flatMap((dataPoint) => dataPoint.perAccountData)),
    [getUniqueItems, rawChartData]
  );
  const uniquePhysicalAssets = useMemo(
    () => getUniqueItems(rawChartData.flatMap((dataPoint) => dataPoint.perAssetData)),
    [getUniqueItems, rawChartData]
  );

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <Subheading level={3} className="truncate">
          <span className="mr-2">Returns</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </Subheading>
        <div className="flex shrink-0 items-center gap-2">
          <Select
            aria-label="Returns data view options"
            className="max-w-48 sm:max-w-64"
            id="returns-data-view"
            name="returns-data-view"
            value={dataView === 'custom' ? customDataID : dataView}
            onChange={(e) => {
              const isCustomSelection =
                e.target.value !== 'rates' &&
                e.target.value !== 'cagr' &&
                e.target.value !== 'annualAmounts' &&
                e.target.value !== 'cumulativeAmounts' &&
                e.target.value !== 'taxCategory' &&
                e.target.value !== 'appreciation';
              if (isCustomSelection) {
                setDataView('custom');
                setCustomDataID(e.target.value);
              } else {
                setDataView(e.target.value as ReturnsDataView);
                setCustomDataID('');
              }
            }}
          >
            <optgroup label="Return Rates">
              <option value="rates">Real Annual Rates</option>
              <option value="cagr">Real CAGR</option>
            </optgroup>
            <optgroup label="Return Amounts">
              <option value="annualAmounts">Annual Gains</option>
              <option value="cumulativeAmounts">Cumulative Gains</option>
              <option value="taxCategory">Tax Category</option>
            </optgroup>
            <optgroup label="Appreciation Amounts">
              <option value="appreciation">Asset Appreciation</option>
            </optgroup>
            <optgroup label="By Account">
              {uniqueAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </optgroup>
            {uniquePhysicalAssets.length > 0 && (
              <optgroup label="By Physical Asset">
                {uniquePhysicalAssets.map((physicalAsset) => (
                  <option key={physicalAsset.id} value={physicalAsset.id}>
                    {physicalAsset.name}
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
          <ChartTimeFrameDropdown timeFrameType="single" />
        </div>
      </div>
      <SingleSimulationReturnsLineChart
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
        rawChartData={rawChartData}
        keyMetrics={keyMetrics}
        showReferenceLines={showReferenceLines}
        dataView={dataView}
        customDataID={customDataID}
        startAge={startAge}
      />
    </Card>
  );
}
