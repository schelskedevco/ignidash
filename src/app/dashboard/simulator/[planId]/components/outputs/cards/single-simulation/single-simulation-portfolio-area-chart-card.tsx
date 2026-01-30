'use client';

import { useMemo, useCallback } from 'react';

import { useShowReferenceLines } from '@/lib/stores/simulator-store';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import type { SingleSimulationPortfolioChartDataPoint } from '@/lib/types/chart-data-points';
import { Subheading } from '@/components/catalyst/heading';

import SingleSimulationPortfolioAreaChart from '../../charts/single-simulation/single-simulation-portfolio-area-chart';
import ChartTimeFrameDropdown from '../../chart-time-frame-dropdown';

interface SingleSimulationPortfolioAreaChartCardProps {
  rawChartData: SingleSimulationPortfolioChartDataPoint[];
  keyMetrics: KeyMetrics;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  setDataView: (view: 'assetClass' | 'taxCategory' | 'netChange' | 'netWorth' | 'changeInNetWorth' | 'custom') => void;
  dataView: 'assetClass' | 'taxCategory' | 'netChange' | 'netWorth' | 'changeInNetWorth' | 'custom';
  setCustomDataID: (name: string) => void;
  customDataID: string;
  startAge: number;
}

export default function SingleSimulationPortfolioAreaChartCard({
  rawChartData,
  keyMetrics,
  onAgeSelect,
  selectedAge,
  setDataView,
  dataView,
  setCustomDataID,
  customDataID,
  startAge,
}: SingleSimulationPortfolioAreaChartCardProps) {
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
  const uniqueDebts = useMemo(
    () => getUniqueItems(rawChartData.flatMap((dataPoint) => dataPoint.perDebtData)),
    [getUniqueItems, rawChartData]
  );

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <Subheading level={3} className="truncate">
          <span className="mr-2">Portfolio</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </Subheading>
        <div className="flex shrink-0 items-center gap-2">
          <Select
            aria-label="Portfolio data view options"
            className="max-w-48 sm:max-w-64"
            id="portfolio-data-view"
            name="portfolio-data-view"
            value={dataView === 'custom' ? customDataID : dataView}
            onChange={(e) => {
              const isCustomSelection =
                e.target.value !== 'assetClass' &&
                e.target.value !== 'taxCategory' &&
                e.target.value !== 'netChange' &&
                e.target.value !== 'netWorth' &&
                e.target.value !== 'changeInNetWorth';
              if (isCustomSelection) {
                setDataView('custom');
                setCustomDataID(e.target.value);
              } else {
                setDataView(e.target.value as 'assetClass' | 'taxCategory' | 'netChange' | 'netWorth' | 'changeInNetWorth');
                setCustomDataID('');
              }
            }}
          >
            <option value="assetClass">Asset Class</option>
            <option value="taxCategory">Tax Category</option>
            <option value="netChange">Net Portfolio Change</option>
            <option value="netWorth">Net Worth</option>
            <option value="changeInNetWorth">Change in NW</option>
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
            {uniqueDebts.length > 0 && (
              <optgroup label="By Debt">
                {uniqueDebts.map((debt) => (
                  <option key={debt.id} value={debt.id}>
                    {debt.name}
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
          <ChartTimeFrameDropdown timeFrameType="single" />
        </div>
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
