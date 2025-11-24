'use client';

import { useMemo, useCallback } from 'react';

import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import type { SingleSimulationReturnsChartDataPoint } from '@/lib/types/chart-data-points';
import { useShowReferenceLines } from '@/lib/stores/simulator-store';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import { Subheading } from '@/components/catalyst/heading';

import SingleSimulationReturnsLineChart from '../../charts/single-simulation/single-simulation-returns-line-chart';

interface SingleSimulationReturnsLineChartCardProps {
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  setDataView: (view: 'rates' | 'annualAmounts' | 'cumulativeAmounts' | 'custom') => void;
  dataView: 'rates' | 'annualAmounts' | 'cumulativeAmounts' | 'custom';
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

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <Subheading level={4}>
          <span className="mr-2">Returns</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </Subheading>
        <Select
          className="max-w-48 sm:max-w-64"
          id="returns-data-view"
          name="returns-data-view"
          value={dataView === 'custom' ? customDataID : dataView}
          onChange={(e) => {
            const isCustomSelection =
              e.target.value !== 'rates' && e.target.value !== 'annualAmounts' && e.target.value !== 'cumulativeAmounts';
            if (isCustomSelection) {
              setDataView('custom');
              setCustomDataID(e.target.value);
            } else {
              setDataView(e.target.value as 'rates' | 'annualAmounts' | 'cumulativeAmounts');
              setCustomDataID('');
            }
          }}
        >
          <optgroup label="Return Rates">
            <option value="rates">Real Annual Returns</option>
          </optgroup>
          <optgroup label="Growth Amounts">
            <option value="annualAmounts">Annual Growth</option>
            <option value="cumulativeAmounts">Cumulative Growth</option>
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
