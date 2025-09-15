'use client';

import { useTheme } from 'next-themes';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';

import { formatNumber, formatChartString } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClickDetection } from '@/hooks/use-outside-click';
import type { SingleSimulationTaxesChartDataPoint } from '@/lib/types/chart-data-points';

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
  dataView: 'marginalRates' | 'effectiveRates' | 'amounts' | 'net' | 'taxableIncome';
}

const CustomTooltip = ({ active, payload, label, startAge, disabled, dataView }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (label! - startAge);

  const formatValue = (value: number, mode: 'marginalRates' | 'effectiveRates' | 'amounts' | 'net' | 'taxableIncome') => {
    switch (mode) {
      case 'marginalRates':
      case 'effectiveRates':
        return `${(value * 100).toFixed(2)}%`;
      case 'amounts':
      case 'net':
      case 'taxableIncome':
        return formatNumber(value, 1, '$');
      default:
        return value;
    }
  };

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
            className={`border-foreground/50 flex justify-between rounded-lg border bg-[${entry.color}]/60 px-2 text-sm`}
          >
            <span className="mr-2">{`${formatChartString(entry.dataKey)}:`}</span>
            <span className="ml-1 font-semibold">{formatValue(entry.value, dataView)}</span>
          </p>
        ))}
      </div>
    </div>
  );
};

const COLORS = ['var(--chart-4)', 'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'];

interface SingleSimulationTaxesLineChartProps {
  rawChartData: SingleSimulationTaxesChartDataPoint[];
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  dataView: 'marginalRates' | 'effectiveRates' | 'amounts' | 'net' | 'taxableIncome';
  startAge: number;
}

export default function SingleSimulationTaxesLineChart({
  rawChartData,
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
        Math.min(0, ...chartData.flatMap((d) => [d.topMarginalIncomeTaxRate * 1.25, d.topMarginalCapitalGainsTaxRate * 1.25])),
        Math.max(0, ...chartData.flatMap((d) => [d.topMarginalIncomeTaxRate * 1.25, d.topMarginalCapitalGainsTaxRate * 1.25])),
      ];
      formatter = (value: number) => `${(value * 100).toFixed(2)}%`;
      dataKeys.push('topMarginalIncomeTaxRate', 'topMarginalCapitalGainsTaxRate');
      break;
    case 'effectiveRates':
      yAxisDomain = [
        Math.min(0, ...chartData.flatMap((d) => [d.effectiveIncomeTaxRate * 1.25, d.effectiveCapitalGainsTaxRate * 1.25])),
        Math.max(0, ...chartData.flatMap((d) => [d.effectiveIncomeTaxRate * 1.25, d.effectiveCapitalGainsTaxRate * 1.25])),
      ];
      formatter = (value: number) => `${(value * 100).toFixed(2)}%`;
      dataKeys.push('effectiveIncomeTaxRate', 'effectiveCapitalGainsTaxRate');
      break;
    case 'amounts':
      yAxisDomain = [
        Math.min(0, ...chartData.flatMap((d) => [d.incomeTaxAmount * 1.25, d.capitalGainsTaxAmount * 1.25])),
        Math.max(0, ...chartData.flatMap((d) => [d.incomeTaxAmount * 1.25, d.capitalGainsTaxAmount * 1.25])),
      ];
      formatter = (value: number) => formatNumber(value, 1, '$');
      dataKeys.push('incomeTaxAmount', 'capitalGainsTaxAmount');
      break;
    case 'net':
      yAxisDomain = [
        Math.min(0, ...chartData.flatMap((d) => [d.netIncome * 1.25, d.netCapitalGains * 1.25])),
        Math.max(0, ...chartData.flatMap((d) => [d.netIncome * 1.25, d.netCapitalGains * 1.25])),
      ];
      formatter = (value: number) => formatNumber(value, 1, '$');
      dataKeys.push('netIncome', 'netCapitalGains');
      break;
    case 'taxableIncome':
      yAxisDomain = [
        Math.min(
          0,
          ...chartData.flatMap((d) => [d.taxableOrdinaryIncome * 1.25, d.taxableCapitalGains * 1.25, d.totalTaxableIncome * 1.25])
        ),
        Math.max(
          0,
          ...chartData.flatMap((d) => [d.taxableOrdinaryIncome * 1.25, d.taxableCapitalGains * 1.25, d.totalTaxableIncome * 1.25])
        ),
      ];
      formatter = (value: number) => formatNumber(value, 1, '$');
      dataKeys.push('taxableOrdinaryIncome', 'taxableCapitalGains', 'totalTaxableIncome');
      break;
  }

  const gridColor = resolvedTheme === 'dark' ? '#374151' : '#d1d5db'; // gray-700 : gray-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f3f4f6' : '#111827'; // gray-100 : gray-900
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d1d5db' : '#4b5563'; // gray-300 : gray-600

  const calculateInterval = (dataLength: number, desiredTicks = 8) => {
    if (dataLength <= desiredTicks) return 0;
    return Math.ceil(dataLength / desiredTicks);
  };
  const interval = calculateInterval(chartData.length);

  const onClick = (data: { activeLabel: string | undefined }) => {
    if (data.activeLabel !== undefined && onAgeSelect) {
      onAgeSelect(Number(data.activeLabel));
    }
  };

  return (
    <div ref={chartRef} className="h-64 w-full sm:h-72 lg:h-80 [&_svg:focus]:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} className="text-xs" margin={{ top: 0, right: 10, left: 10, bottom: 0 }} tabIndex={-1} onClick={onClick}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} dataKey="age" interval={interval} />
          <YAxis
            tick={{ fill: foregroundMutedColor }}
            axisLine={false}
            hide={isSmallScreen}
            tickFormatter={formatter}
            domain={yAxisDomain}
          />
          {dataKeys.map((dataKey, index) => (
            <Line key={dataKey} type="monotone" dataKey={dataKey} stroke={COLORS[index % COLORS.length]} />
          ))}
          <Tooltip
            content={<CustomTooltip startAge={startAge} disabled={isSmallScreen && clickedOutsideChart} dataView={dataView} />}
            cursor={{ stroke: foregroundColor }}
          />
          {selectedAge && <ReferenceLine x={selectedAge} stroke={foregroundMutedColor} strokeWidth={1} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
