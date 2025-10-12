'use client';

import { useTheme } from 'next-themes';
import { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';

import { formatNumber, formatChartString } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClickDetection } from '@/hooks/use-outside-click';
import type { SingleSimulationTaxesChartDataPoint } from '@/lib/types/chart-data-points';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import { Divider } from '@/components/catalyst/divider';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof SingleSimulationTaxesChartDataPoint;
    payload: SingleSimulationTaxesChartDataPoint;
  }>;
  label?: number;
  startAge: number;
  disabled: boolean;
  dataView: 'marginalRates' | 'effectiveRates' | 'annualAmounts' | 'cumulativeAmounts' | 'netIncome' | 'taxableIncome';
}

const CustomTooltip = ({ active, payload, label, startAge, disabled, dataView }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (label! - startAge);

  const needsBgTextColor = ['var(--chart-3)', 'var(--chart-4)'];

  const formatValue = (
    value: number,
    mode: 'marginalRates' | 'effectiveRates' | 'annualAmounts' | 'cumulativeAmounts' | 'netIncome' | 'taxableIncome'
  ) => {
    switch (mode) {
      case 'marginalRates':
      case 'effectiveRates':
        return `${(value * 100).toFixed(2)}%`;
      case 'annualAmounts':
      case 'cumulativeAmounts':
      case 'netIncome':
      case 'taxableIncome':
        return formatNumber(value, 1, '$');
      default:
        return value;
    }
  };

  let header = null;
  let totalFooter = null;
  switch (dataView) {
    case 'marginalRates':
    case 'effectiveRates':
      break;
    case 'annualAmounts':
    case 'cumulativeAmounts':
    case 'netIncome':
      totalFooter = (
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
      break;
    case 'taxableIncome':
      const entry = payload[0].payload;

      const adjustments = Object.entries(entry.adjustments).map(([name, value]) => (
        <p key={name} className="flex justify-between text-sm font-semibold">
          <span className="mr-2">{`${formatChartString(name)}:`}</span>
          <span className="ml-1 font-semibold">{formatNumber(value, 1, '$')}</span>
        </p>
      ));

      const deductions = Object.entries(entry.deductions).map(([name, value]) => (
        <p key={name} className="flex justify-between text-sm font-semibold">
          <span className="mr-2">{`${formatChartString(name)}:`}</span>
          <span className="ml-1 font-semibold">{formatNumber(value, 1, '$')}</span>
        </p>
      ));

      header = (
        <div className="mx-1 mb-2 flex flex-col gap-2">
          <p className="flex justify-between text-sm font-semibold">
            <span className="mr-2">Gross Income:</span>
            <span className="ml-1 font-semibold">{formatNumber(entry.grossIncome, 1, '$')}</span>
          </p>
          <Divider />
          <p className="text-muted-foreground -mb-2 text-xs/6">Adjustments</p>
          {adjustments}
          <Divider />
          <p className="text-muted-foreground -mb-2 text-xs/6">Deductions</p>
          {deductions}
          <Divider />
        </div>
      );
      break;
  }

  return (
    <div className="text-foreground bg-background rounded-lg border p-2 shadow-md">
      <p className="mx-1 mb-2 flex justify-between text-sm font-semibold">
        <span>Age {label}</span>
        <span className="text-muted-foreground">{yearForAge}</span>
      </p>
      {header}
      <div className="flex flex-col gap-2">
        {payload.map((entry) => (
          <p
            key={entry.dataKey}
            style={{ backgroundColor: entry.color }}
            className={`border-foreground/50 flex justify-between rounded-lg border px-2 text-sm ${needsBgTextColor.includes(entry.color) ? 'text-background' : 'text-foreground'}`}
          >
            <span className="mr-2">{`${formatChartString(entry.dataKey)}:`}</span>
            <span className="ml-1 font-semibold">{formatValue(entry.value, dataView)}</span>
          </p>
        ))}
      </div>
      {totalFooter}
    </div>
  );
};

const COLORS = ['var(--chart-2)', 'var(--chart-4)', 'var(--chart-3)', 'var(--chart-1)'];

interface SingleSimulationTaxesLineChartProps {
  rawChartData: SingleSimulationTaxesChartDataPoint[];
  keyMetrics: KeyMetrics;
  showReferenceLines: boolean;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  dataView: 'marginalRates' | 'effectiveRates' | 'annualAmounts' | 'cumulativeAmounts' | 'netIncome' | 'taxableIncome';
  startAge: number;
}

export default function SingleSimulationTaxesLineChart({
  rawChartData,
  keyMetrics,
  showReferenceLines,
  onAgeSelect,
  selectedAge,
  dataView,
  startAge,
}: SingleSimulationTaxesLineChartProps) {
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const chartRef = useClickDetection<HTMLDivElement>(
    () => setClickedOutsideChart(true),
    () => setClickedOutsideChart(false)
  );

  const chartData: SingleSimulationTaxesChartDataPoint[] = rawChartData;

  const dataKeys: (keyof SingleSimulationTaxesChartDataPoint)[] = [];
  let yAxisDomain: [number, number] | undefined = undefined;
  let formatter = undefined;
  switch (dataView) {
    case 'marginalRates':
      yAxisDomain = [
        Math.min(0, ...chartData.flatMap((d) => [d.topMarginalIncomeTaxRate * 1.25, d.topMarginalCapGainsTaxRate * 1.25])),
        Math.max(0, ...chartData.flatMap((d) => [d.topMarginalIncomeTaxRate * 1.25, d.topMarginalCapGainsTaxRate * 1.25])),
      ];
      formatter = (value: number) => `${(value * 100).toFixed(2)}%`;
      dataKeys.push('topMarginalIncomeTaxRate', 'topMarginalCapGainsTaxRate');
      break;
    case 'effectiveRates':
      formatter = (value: number) => `${(value * 100).toFixed(2)}%`;
      dataKeys.push('effectiveIncomeTaxRate', 'effectiveCapGainsTaxRate');
      break;
    case 'annualAmounts':
      formatter = (value: number) => formatNumber(value, 1, '$');
      dataKeys.push('annualIncomeTaxAmount', 'annualCapGainsTaxAmount');
      break;
    case 'cumulativeAmounts':
      formatter = (value: number) => formatNumber(value, 1, '$');
      dataKeys.push('cumulativeIncomeTaxAmount', 'cumulativeCapGainsTaxAmount');
      break;
    case 'netIncome':
      formatter = (value: number) => formatNumber(value, 1, '$');
      dataKeys.push('netIncome', 'netCapGains');
      break;
    case 'taxableIncome':
      formatter = (value: number) => formatNumber(value, 1, '$');
      dataKeys.push('taxableOrdinaryIncome', 'taxableCapGains', 'totalTaxableIncome');
      break;
  }

  const gridColor = resolvedTheme === 'dark' ? '#44403c' : '#d6d3d1'; // stone-700 : stone-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f5f5f4' : '#1c1917'; // stone-100 : stone-900
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d6d3d1' : '#57534e'; // stone-300 : stone-600
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
            <YAxis
              tick={{ fill: foregroundMutedColor }}
              axisLine={false}
              tickLine={false}
              hide={isSmallScreen}
              tickFormatter={formatter}
              domain={yAxisDomain}
            />
            {dataKeys.map((dataKey, index) => (
              <Line
                key={dataKey}
                type="monotone"
                dataKey={dataKey}
                stroke={COLORS[index % COLORS.length]}
                dot={false}
                activeDot={false}
                strokeWidth={3}
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
      <div
        className={`mt-2 grid grid-cols-2 gap-2 sm:flex sm:justify-center sm:gap-x-4 ${!isSmallScreen ? 'ml-16' : ''}`}
        role="group"
        aria-label="Chart legend"
      >
        {dataKeys.map((dataKey, index) => (
          <div key={dataKey} className="flex items-center gap-x-2 text-sm font-medium">
            <svg viewBox="0 0 6 6" aria-hidden="true" style={{ fill: COLORS[index % COLORS.length] }} className="size-5 shrink-0">
              <rect x={0.5} y={0.5} width={5} height={5} stroke={legendStrokeColor} strokeWidth={0.5} paintOrder="stroke" />
            </svg>
            {formatChartString(dataKey)}
          </div>
        ))}
      </div>
    </div>
  );
}
