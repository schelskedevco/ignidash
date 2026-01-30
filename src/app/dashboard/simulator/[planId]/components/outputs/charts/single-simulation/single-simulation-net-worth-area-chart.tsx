'use client';

import { useTheme } from 'next-themes';
import { useState, useCallback, memo } from 'react';
import { ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { ChartLineIcon } from 'lucide-react';

import type { KeyMetrics } from '@/lib/types/key-metrics';
import type { SingleSimulationNetWorthChartDataPoint } from '@/lib/types/chart-data-points';
import type { AccountDataWithTransactions } from '@/lib/calc/account';
import type { PhysicalAssetData } from '@/lib/calc/physical-assets';
import type { DebtData } from '@/lib/calc/debts';
import { formatNumber, formatChartString, cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClickDetection } from '@/hooks/use-outside-click';
import { useChartDataSlice } from '@/hooks/use-chart-data-slice';
import { useLineChartLegendEffectOpacity } from '@/hooks/use-line-chart-legend-effect-opacity';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof SingleSimulationNetWorthChartDataPoint | keyof AccountDataWithTransactions | keyof PhysicalAssetData | keyof DebtData;
    payload:
      | SingleSimulationNetWorthChartDataPoint
      | ({ age: number; stockHoldings: number; bondHoldings: number; cashHoldings: number } & AccountDataWithTransactions)
      | ({ age: number } & PhysicalAssetData)
      | ({ age: number } & DebtData);
  }>;
  label?: number;
  startAge: number;
  disabled: boolean;
  dataView: 'assetClass' | 'taxCategory' | 'netPortfolioChange' | 'netWorth' | 'netWorthChange' | 'custom';
  customDataType: 'account' | 'asset' | 'debt' | undefined;
}

const CustomTooltip = memo(({ active, payload, label, startAge, disabled, dataView, customDataType }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (label! - Math.floor(startAge));

  const needsBgTextColor = ['var(--chart-3)', 'var(--chart-4)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)', 'var(--foreground)'];

  const transformedPayload = payload.filter((entry) => entry.color !== LINE_COLOR);

  let body = null;
  let footer = null;
  switch (dataView) {
    case 'netPortfolioChange':
    case 'netWorth':
    case 'netWorthChange': {
      const lineData = payload.find((entry) => entry.dataKey === dataView);
      if (!lineData) {
        console.error(`${formatChartString(dataView)} data not found`);
        break;
      }

      body = (
        <div className="flex flex-col gap-1">
          {transformedPayload.map((entry) => (
            <p
              key={entry.dataKey}
              style={{ backgroundColor: entry.color }}
              className={cn('border-foreground/50 flex justify-between rounded-lg border px-2 text-sm', {
                'text-background': needsBgTextColor.includes(entry.color),
              })}
            >
              <span className="mr-2">{`${formatChartString(entry.dataKey)}:`}</span>
              <span className="ml-1 font-semibold">{formatNumber(entry.value, 1, '$')}</span>
            </p>
          ))}
        </div>
      );

      footer = (
        <p className="mx-1 mt-2 flex justify-between text-sm font-semibold">
          <span className="flex items-center gap-1">
            <ChartLineIcon className="h-3 w-3" />
            <span className="mr-2">{`${formatChartString(dataView)}:`}</span>
          </span>
          <span className="ml-1 font-semibold">{formatNumber(lineData.value, 3, '$')}</span>
        </p>
      );
      break;
    }
    case 'custom': {
      const total = transformedPayload.reduce((sum, item) => sum + item.value, 0);

      body = (
        <div className="flex flex-col gap-1">
          {transformedPayload.map((entry) => (
            <p
              key={entry.dataKey}
              style={{ backgroundColor: entry.color }}
              className={cn('border-foreground/50 flex justify-between rounded-lg border px-2 text-sm', {
                'text-background': needsBgTextColor.includes(entry.color),
              })}
            >
              <span className="mr-2">{`${formatChartString(entry.dataKey)}:`}</span>
              <span className="ml-1 font-semibold">{formatNumber(entry.value, 1, '$')}</span>
            </p>
          ))}
        </div>
      );

      const footerConfig = {
        account: { title: 'Account Value', icon: null },
        asset: { title: 'Equity', icon: <ChartLineIcon className="h-3 w-3" /> },
        debt: { title: 'Debt Balance', icon: null },
      } as const;

      const { title: footerTitle, icon: footerIcon } = footerConfig[customDataType!];

      footer = (
        <p className="mx-1 mt-2 flex justify-between text-sm font-semibold">
          <span className="flex items-center gap-1">
            {footerIcon}
            <span className="mr-2">{footerTitle}:</span>
          </span>
          <span className="ml-1 font-semibold">{formatNumber(total, 3, '$')}</span>
        </p>
      );

      break;
    }
    default: {
      const total = transformedPayload.reduce((sum, item) => sum + item.value, 0);

      body = (
        <div className="flex flex-col gap-1">
          {transformedPayload.map((entry) => (
            <p
              key={entry.dataKey}
              style={{ backgroundColor: entry.color }}
              className={cn('border-foreground/50 flex justify-between rounded-lg border px-2 text-sm', {
                'text-background': needsBgTextColor.includes(entry.color),
              })}
            >
              <span className="mr-2">{`${formatChartString(entry.dataKey)}:`}</span>
              <span className="ml-1 font-semibold">
                {formatNumber(entry.value, 1, '$')}
                {total > 0 && ` (${formatNumber((entry.value / total) * 100, 1)}%)`}
              </span>
            </p>
          ))}
        </div>
      );

      footer = (
        <p className="mx-1 mt-2 flex justify-between text-sm font-semibold">
          <span className="mr-2">Total:</span>
          <span className="ml-1 font-semibold">{formatNumber(total, 3, '$')}</span>
        </p>
      );
      break;
    }
  }

  return (
    <div className="text-foreground bg-background rounded-lg border p-2 shadow-md">
      <p className="mx-1 mb-2 flex justify-between text-sm font-semibold">
        <span className="mr-2">Age {label}</span>
        <span className="text-muted-foreground ml-1">{yearForAge}</span>
      </p>
      {body}
      {footer}
    </div>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

const LINE_COLOR = 'var(--foreground)';

interface SingleSimulationNetWorthAreaChartProps {
  rawChartData: SingleSimulationNetWorthChartDataPoint[];
  startAge: number;
  keyMetrics: KeyMetrics;
  showReferenceLines: boolean;
  dataView: 'assetClass' | 'taxCategory' | 'netPortfolioChange' | 'netWorth' | 'netWorthChange' | 'custom';
  customDataID: string;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
}

export default function SingleSimulationNetWorthAreaChart({
  rawChartData,
  startAge,
  keyMetrics,
  showReferenceLines,
  dataView,
  customDataID,
  onAgeSelect,
  selectedAge,
}: SingleSimulationNetWorthAreaChartProps) {
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const chartRef = useClickDetection<HTMLDivElement>(
    () => setClickedOutsideChart(true),
    () => setClickedOutsideChart(false)
  );

  let chartData:
    | SingleSimulationNetWorthChartDataPoint[]
    | Array<{ age: number; stockHoldings: number; bondHoldings: number; cashHoldings: number } & AccountDataWithTransactions>
    | Array<{ age: number } & PhysicalAssetData>
    | Array<{ age: number } & DebtData> = useChartDataSlice(rawChartData, 'single');

  const areaDataKeys: (
    | keyof SingleSimulationNetWorthChartDataPoint
    | keyof AccountDataWithTransactions
    | keyof PhysicalAssetData
    | keyof DebtData
  )[] = [];
  const areaColors: string[] = [];

  const lineDataKeys: (
    | keyof SingleSimulationNetWorthChartDataPoint
    | keyof AccountDataWithTransactions
    | keyof PhysicalAssetData
    | keyof DebtData
  )[] = [];

  const barDataKeys: (
    | keyof SingleSimulationNetWorthChartDataPoint
    | keyof AccountDataWithTransactions
    | keyof PhysicalAssetData
    | keyof DebtData
  )[] = [];
  const barColors: string[] = [];

  const formatter = (value: number) => formatNumber(value, 1, '$');
  let stackOffset: 'sign' | undefined = undefined;

  let customDataType: 'account' | 'asset' | 'debt' | undefined = undefined;

  switch (dataView) {
    case 'assetClass':
      areaDataKeys.push('stockHoldings', 'bondHoldings', 'cashHoldings');
      areaColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)');
      break;
    case 'taxCategory':
      areaDataKeys.push('taxableValue', 'taxDeferredValue', 'taxFreeValue', 'cashSavings');
      areaColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)');
      break;
    case 'netPortfolioChange':
      lineDataKeys.push('netPortfolioChange');

      barDataKeys.push('annualReturns', 'annualContributions', 'annualWithdrawals');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)');

      chartData = chartData.map((entry) => ({ ...entry, annualWithdrawals: -entry.annualWithdrawals }));

      stackOffset = 'sign';
      break;
    case 'netWorth':
      lineDataKeys.push('netWorth');

      barDataKeys.push('portfolioValue', 'assetValue', 'debtBalance');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)');

      chartData = chartData.map((entry) => ({ ...entry, debtBalance: -entry.debtBalance }));

      stackOffset = 'sign';
      break;
    case 'netWorthChange':
      lineDataKeys.push('netWorthChange');

      barDataKeys.push('annualReturns', 'annualContributions', 'annualWithdrawals', 'annualAssetAppreciation', 'annualDebtPaydown');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)');

      chartData = chartData.map((entry) => ({ ...entry, annualWithdrawals: -entry.annualWithdrawals }));

      stackOffset = 'sign';
      break;
    case 'custom':
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        break;
      }

      const perAccountData = chartData.flatMap(({ age, perAccountData }) =>
        perAccountData
          .filter((account) => account.id === customDataID)
          .map((account) => {
            const balance = account.balance;

            const assetAllocation = account.assetAllocation ?? { stocks: 0, bonds: 0, cash: 0 };
            const stocksAllocation = assetAllocation.stocks;
            const bondsAllocation = assetAllocation.bonds;
            const cashAllocation = assetAllocation.cash;

            return {
              age,
              ...account,
              stockHoldings: balance * stocksAllocation,
              bondHoldings: balance * bondsAllocation,
              cashHoldings: balance * cashAllocation,
            };
          })
      );
      if (perAccountData.length > 0) {
        customDataType = 'account';

        areaDataKeys.push('stockHoldings', 'bondHoldings', 'cashHoldings');
        areaColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)');

        chartData = perAccountData;
        break;
      }

      const perAssetData = chartData.flatMap(({ age, perAssetData }) =>
        perAssetData.filter((asset) => asset.id === customDataID).map((asset) => ({ age, ...asset, loanBalance: -asset.loanBalance }))
      );
      if (perAssetData.length > 0) {
        customDataType = 'asset';
        lineDataKeys.push('equity');

        barDataKeys.push('loanBalance', 'marketValue');
        barColors.push('var(--chart-1)', 'var(--chart-2)');

        chartData = perAssetData;

        stackOffset = 'sign';
        break;
      }

      const perDebtData = chartData.flatMap(({ age, perDebtData }) =>
        perDebtData.filter((debt) => debt.id === customDataID).map((debt) => ({ age, ...debt }))
      );
      if (perDebtData.length > 0) {
        customDataType = 'debt';

        areaDataKeys.push('balance');
        areaColors.push('var(--chart-1)');

        chartData = perDebtData;
        break;
      }

      break;
  }

  const gridColor = resolvedTheme === 'dark' ? '#44403c' : '#d6d3d1'; // stone-700 : stone-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f5f5f4' : '#1c1917'; // stone-100 : stone-900
  const backgroundColor = resolvedTheme === 'dark' ? '#292524' : '#ffffff'; // stone-800 : white
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d6d3d1' : '#57534e'; // stone-300 : stone-600

  const calculateInterval = useCallback((dataLength: number, desiredTicks = 12) => {
    if (dataLength <= desiredTicks) return 0;
    return Math.ceil(dataLength / desiredTicks) - 1;
  }, []);
  const interval = calculateInterval(chartData.length);

  const onClick = useCallback(
    (data: { activeLabel: string | number | undefined }) => {
      if (data.activeLabel !== undefined && onAgeSelect) {
        onAgeSelect(Number(data.activeLabel));
      }
    },
    [onAgeSelect]
  );

  const { getOpacity } = useLineChartLegendEffectOpacity();

  const allDataKeys = [...areaDataKeys, ...lineDataKeys, ...barDataKeys];
  const hasNoData =
    chartData.length === 0 || chartData.every((point) => allDataKeys.every((key) => point[key as keyof typeof point] === 0));
  if (hasNoData) {
    return <div className="flex h-72 w-full items-center justify-center sm:h-84 lg:h-96">No data available for the selected view.</div>;
  }

  return (
    <div ref={chartRef} className="h-72 w-full sm:h-84 lg:h-96 [&_g:focus]:outline-none [&_svg:focus]:outline-none">
      <ComposedChart
        responsive
        width="100%"
        height="100%"
        data={chartData}
        className="text-xs"
        stackOffset={stackOffset}
        margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
        tabIndex={-1}
        onClick={onClick}
      >
        <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
        <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} dataKey="age" interval={interval} />
        <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} hide={isSmallScreen} tickFormatter={formatter} />
        {stackOffset === 'sign' && <ReferenceLine y={0} stroke={foregroundColor} strokeWidth={1} ifOverflow="extendDomain" />}
        {areaDataKeys.map((dataKey, i) => (
          <Area
            key={`area-${dataKey}-${i}`}
            type="monotone"
            dataKey={dataKey}
            stackId="1"
            stroke={areaColors[i]}
            fill={areaColors[i]}
            fillOpacity={1}
            activeDot={false}
          />
        ))}
        {lineDataKeys.map((dataKey, i) => (
          <Line
            key={`line-${dataKey}-${i}`}
            type="monotone"
            dataKey={dataKey}
            stroke={LINE_COLOR}
            activeDot={{ stroke: backgroundColor, strokeWidth: 2 }}
            dot={{ fill: backgroundColor, strokeWidth: 2 }}
            strokeWidth={2}
            strokeOpacity={getOpacity(dataKey)}
          />
        ))}
        {barDataKeys.map((dataKey, i) => (
          <Bar key={`bar-${dataKey}-${i}`} dataKey={dataKey} maxBarSize={20} stackId="stack" fill={barColors[i]} />
        ))}
        <Tooltip
          content={
            <CustomTooltip
              startAge={startAge}
              disabled={isSmallScreen && clickedOutsideChart}
              dataView={dataView}
              customDataType={customDataType}
            />
          }
          cursor={{ stroke: foregroundColor }}
        />
        {keyMetrics.retirementAge && showReferenceLines && (
          <ReferenceLine x={Math.round(keyMetrics.retirementAge)} stroke={foregroundMutedColor} strokeDasharray="10 5" />
        )}
        {selectedAge && <ReferenceLine x={selectedAge} stroke={foregroundMutedColor} strokeWidth={1.5} ifOverflow="visible" />}
        {keyMetrics.portfolioAtRetirement && showReferenceLines && ['assetClass', 'taxCategory'].includes(dataView) && (
          <ReferenceLine y={Math.round(keyMetrics.portfolioAtRetirement)} stroke={foregroundMutedColor} strokeDasharray="10 5" />
        )}
      </ComposedChart>
    </div>
  );
}
