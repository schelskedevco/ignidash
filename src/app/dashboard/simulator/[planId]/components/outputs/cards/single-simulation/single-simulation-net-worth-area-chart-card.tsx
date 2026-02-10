'use client';

import { useMemo, useCallback } from 'react';

import { useShowReferenceLines } from '@/lib/stores/simulator-store';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import type { SingleSimulationNetWorthChartDataPoint } from '@/lib/types/chart-data-points';
import type { NetWorthDataView } from '@/lib/types/chart-data-views';
import { Subheading } from '@/components/catalyst/heading';

import SingleSimulationNetWorthAreaChart from '../../charts/single-simulation/single-simulation-net-worth-area-chart';
import ChartTimeFrameDropdown from '../../chart-time-frame-dropdown';

interface SingleSimulationNetWorthAreaChartCardProps {
  rawChartData: SingleSimulationNetWorthChartDataPoint[];
  keyMetrics: KeyMetrics;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  setDataView: (view: NetWorthDataView) => void;
  dataView: NetWorthDataView;
  setCustomDataID: (name: string) => void;
  customDataID: string;
  startAge: number;
}

export default function SingleSimulationNetWorthAreaChartCard({
  rawChartData,
  keyMetrics,
  onAgeSelect,
  selectedAge,
  setDataView,
  dataView,
  setCustomDataID,
  customDataID,
  startAge,
}: SingleSimulationNetWorthAreaChartCardProps) {
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
          <span className="mr-2">Net Worth</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </Subheading>
        <div className="flex shrink-0 items-center gap-2">
          <Select
            aria-label="Net worth data view options"
            className="max-w-48 sm:max-w-64"
            id="net-worth-data-view"
            name="net-worth-data-view"
            value={dataView === 'custom' ? customDataID : dataView}
            onChange={(e) => {
              const isCustomSelection =
                e.target.value !== 'assetClass' &&
                e.target.value !== 'taxCategory' &&
                e.target.value !== 'netPortfolioChange' &&
                e.target.value !== 'netWorth' &&
                e.target.value !== 'netWorthChange' &&
                e.target.value !== 'assetEquity' &&
                e.target.value !== 'netAssetChange' &&
                e.target.value !== 'debts' &&
                e.target.value !== 'netDebtReduction';
              if (isCustomSelection) {
                setDataView('custom');
                setCustomDataID(e.target.value);
              } else {
                setDataView(e.target.value as NetWorthDataView);
                setCustomDataID('');
              }
            }}
          >
            <option value="netWorth">Net Worth</option>
            <option value="netWorthChange">Net Worth Change</option>
            <optgroup label="Investment Portfolio">
              <option value="assetClass">Asset Class</option>
              <option value="taxCategory">Tax Category</option>
              <option value="netPortfolioChange">Net Portfolio Change</option>
            </optgroup>
            <optgroup label="Physical Assets">
              <option value="assetEquity">Asset Equity</option>
              <option value="netAssetChange">Net Asset Change</option>
            </optgroup>
            <optgroup label="Debts">
              <option value="debts">Debt Balance</option>
              <option value="netDebtReduction">Net Debt Reduction</option>
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
      <SingleSimulationNetWorthAreaChart
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
