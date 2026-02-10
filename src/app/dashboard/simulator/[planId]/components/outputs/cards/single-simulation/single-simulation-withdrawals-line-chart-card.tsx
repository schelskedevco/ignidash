'use client';

import { useMemo, useCallback } from 'react';

import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import type { SingleSimulationWithdrawalsChartDataPoint } from '@/lib/types/chart-data-points';
import type { WithdrawalsDataView } from '@/lib/types/chart-data-views';
import { useShowReferenceLines } from '@/lib/stores/simulator-store';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import { Subheading } from '@/components/catalyst/heading';

import SingleSimulationWithdrawalsLineChart from '../../charts/single-simulation/single-simulation-withdrawals-line-chart';
import ChartTimeFrameDropdown from '../../chart-time-frame-dropdown';

interface SingleSimulationWithdrawalsLineChartCardProps {
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  setDataView: (view: WithdrawalsDataView) => void;
  dataView: WithdrawalsDataView;
  setCustomDataID: (name: string) => void;
  customDataID: string;
  rawChartData: SingleSimulationWithdrawalsChartDataPoint[];
  keyMetrics: KeyMetrics;
  startAge: number;
}

export default function SingleSimulationWithdrawalsLineChartCard({
  onAgeSelect,
  selectedAge,
  setDataView,
  dataView,
  setCustomDataID,
  customDataID,
  rawChartData,
  keyMetrics,
  startAge,
}: SingleSimulationWithdrawalsLineChartCardProps) {
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
        <Subheading level={3} className="truncate">
          <span className="mr-2">Withdrawals</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </Subheading>
        <div className="flex shrink-0 items-center gap-2">
          <Select
            aria-label="Withdrawals data view options"
            className="max-w-48 sm:max-w-64"
            id="withdrawals-data-view"
            name="withdrawals-data-view"
            value={dataView === 'custom' ? customDataID : dataView}
            onChange={(e) => {
              const isCustomSelection =
                e.target.value !== 'annualAmounts' &&
                e.target.value !== 'cumulativeAmounts' &&
                e.target.value !== 'taxCategory' &&
                e.target.value !== 'realizedGains' &&
                e.target.value !== 'requiredMinimumDistributions' &&
                e.target.value !== 'earlyWithdrawals' &&
                e.target.value !== 'shortfall' &&
                e.target.value !== 'withdrawalRate';
              if (isCustomSelection) {
                setDataView('custom');
                setCustomDataID(e.target.value);
              } else {
                setDataView(e.target.value as WithdrawalsDataView);
                setCustomDataID('');
              }
            }}
          >
            <option value="taxCategory">Tax Category</option>
            <option value="annualAmounts">Annual Withdrawals</option>
            <option value="cumulativeAmounts">Cumulative Withdrawals</option>
            <option value="requiredMinimumDistributions">Required Minimum Distributions</option>
            <option value="withdrawalRate">Withdrawal Rate</option>
            <optgroup label="Taxable Brokerage">
              <option value="realizedGains">Realized Gains</option>
            </optgroup>
            <optgroup label="Issues & Penalties">
              <option value="earlyWithdrawals">Early Withdrawals</option>
              <option value="shortfall">Shortfall</option>
            </optgroup>
            <optgroup label="By Account">
              {uniqueAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </optgroup>
          </Select>
          <ChartTimeFrameDropdown timeFrameType="single" />
        </div>
      </div>
      <SingleSimulationWithdrawalsLineChart
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
