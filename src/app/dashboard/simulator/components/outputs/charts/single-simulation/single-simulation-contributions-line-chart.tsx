'use client';

import { useTheme } from 'next-themes';
import { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';

import { formatNumber, formatChartString, cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClickDetection } from '@/hooks/use-outside-click';
import type { SingleSimulationContributionsChartDataPoint } from '@/lib/types/chart-data-points';
import type { AccountDataWithTransactions } from '@/lib/calc/account';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import { useLineChartLegendEffectOpacity } from '@/hooks/use-line-chart-legend-effect-opacity';

import TimeSeriesLegend from '../time-series-legend';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof SingleSimulationContributionsChartDataPoint;
    payload:
      | SingleSimulationContributionsChartDataPoint
      | ({ age: number; annualContributions: number; cumulativeContributions: number } & AccountDataWithTransactions);
  }>;
  label?: number;
  startAge: number;
  disabled: boolean;
  dataView: 'annualAmounts' | 'cumulativeAmounts' | 'taxCategory' | 'custom' | 'employerMatch';
}

const CustomTooltip = ({ active, payload, label, startAge, disabled, dataView }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (label! - startAge);

  const needsBgTextColor = ['var(--chart-3)', 'var(--chart-4)'];

  let tooltipFooterComponent = null;
  if (dataView === 'taxCategory') {
    tooltipFooterComponent = (
      <p className="mx-1 mt-2 flex justify-between text-sm font-semibold">
        <span className="mr-2">Total:</span>
        <span className="ml-1 font-semibold">
          {formatNumber(
            payload.reduce((sum, item) => sum + item.value, 0),
            3,
            '$'
          )}
        </span>
      </p>
    );
  }

  return (
    <div className="text-foreground bg-background rounded-lg border p-2 shadow-md">
      <p className="mx-1 mb-2 flex justify-between text-sm font-semibold">
        <span>Age {label}</span>
        <span className="text-muted-foreground">{yearForAge}</span>
      </p>
      <div className="flex flex-col gap-2">
        {payload.map((entry) => (
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
      {tooltipFooterComponent}
    </div>
  );
};

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

interface SingleSimulationContributionsLineChartProps {
  rawChartData: SingleSimulationContributionsChartDataPoint[];
  keyMetrics: KeyMetrics;
  showReferenceLines: boolean;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  dataView: 'annualAmounts' | 'cumulativeAmounts' | 'taxCategory' | 'custom' | 'employerMatch';
  customDataID: string;
  startAge: number;
}

export default function SingleSimulationContributionsLineChart({
  rawChartData,
  keyMetrics,
  showReferenceLines,
  onAgeSelect,
  selectedAge,
  dataView,
  customDataID,
  startAge,
}: SingleSimulationContributionsLineChartProps) {
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const chartRef = useClickDetection<HTMLDivElement>(
    () => setClickedOutsideChart(true),
    () => setClickedOutsideChart(false)
  );

  let chartData:
    | SingleSimulationContributionsChartDataPoint[]
    | Array<{ age: number; annualContributions: number; cumulativeContributions: number } & AccountDataWithTransactions> = rawChartData;

  const dataKeys: (keyof SingleSimulationContributionsChartDataPoint)[] = [];
  const formatter = (value: number) => formatNumber(value, 1, '$');
  switch (dataView) {
    case 'annualAmounts':
      dataKeys.push('annualContributions');
      break;
    case 'cumulativeAmounts':
      dataKeys.push('cumulativeContributions');
      break;
    case 'taxCategory':
      dataKeys.push('taxableContributions', 'taxDeferredContributions', 'taxFreeContributions', 'cashContributions');
      break;
    case 'employerMatch':
      dataKeys.push('annualEmployerMatch', 'cumulativeEmployerMatch');
      break;
    case 'custom':
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        break;
      }

      const perAccountData = chartData.flatMap(({ age, perAccountData }) =>
        perAccountData
          .filter((account) => account.id === customDataID)
          .map((account) => ({
            age,
            ...account,
            annualContributions: account.contributionsForPeriod,
            cumulativeContributions: account.totalContributions,
          }))
      );

      chartData = perAccountData;
      dataKeys.push('annualContributions', 'cumulativeContributions');
      break;
  }

  const gridColor = resolvedTheme === 'dark' ? '#3f3f46' : '#d4d4d8'; // zinc-700 : zinc-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f4f4f5' : '#18181b'; // zinc-100 : zinc-900
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d4d4d8' : '#52525b'; // zinc-300 : zinc-600
  const legendStrokeColor = resolvedTheme === 'dark' ? 'white' : 'black';

  const calculateInterval = useCallback((dataLength: number, desiredTicks = 8) => {
    if (dataLength <= desiredTicks) return 0;
    return Math.ceil(dataLength / desiredTicks);
  }, []);
  const interval = calculateInterval(chartData.length);

  const onClick = useCallback(
    (data: { activeLabel: string | undefined }) => {
      if (data.activeLabel !== undefined && onAgeSelect) {
        onAgeSelect(Number(data.activeLabel));
      }
    },
    [onAgeSelect]
  );

  const { getOpacity, handleMouseEnter, handleMouseLeave } = useLineChartLegendEffectOpacity();

  return (
    <div>
      <div ref={chartRef} className="h-64 w-full sm:h-72 lg:h-80 [&_svg:focus]:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            className="text-xs"
            margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
            tabIndex={-1}
            onClick={onClick}
          >
            <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
            <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} dataKey="age" interval={interval} />
            <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} hide={isSmallScreen} tickFormatter={formatter} />
            {dataKeys.map((dataKey, index) => (
              <Line
                key={dataKey}
                type="monotone"
                dataKey={dataKey}
                stroke={COLORS[index % COLORS.length]}
                dot={false}
                activeDot={false}
                strokeWidth={3}
                strokeOpacity={getOpacity(dataKey)}
              />
            ))}
            <Tooltip
              content={<CustomTooltip startAge={startAge} disabled={isSmallScreen && clickedOutsideChart} dataView={dataView} />}
              cursor={{ stroke: foregroundColor }}
            />
            {keyMetrics.retirementAge && showReferenceLines && (
              <ReferenceLine x={Math.round(keyMetrics.retirementAge)} stroke={foregroundMutedColor} strokeDasharray="10 5" />
            )}
            {selectedAge && <ReferenceLine x={selectedAge} stroke={foregroundMutedColor} strokeWidth={1} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <TimeSeriesLegend
        colors={COLORS}
        legendStrokeColor={legendStrokeColor}
        dataKeys={dataKeys}
        isSmallScreen={isSmallScreen}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
