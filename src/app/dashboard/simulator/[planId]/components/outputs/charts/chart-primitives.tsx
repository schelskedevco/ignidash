'use client';

import type { ReactNode, Ref } from 'react';
import { CartesianGrid, XAxis, YAxis, ReferenceLine, Line, Bar, Area, Cell } from 'recharts';

import { formatChartString, cn } from '@/lib/utils';
import { formatCompactCurrency } from '@/lib/utils/currency-formatters';
import { useChartTheme } from '@/hooks/use-chart-theme';
import { useIsMobile } from '@/hooks/use-mobile';
import type { KeyMetrics } from '@/lib/types/key-metrics';

export const NEEDS_BG_TEXT_COLORS = [
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
  'var(--foreground)',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CustomizedAxisTick = ({ x, y, payload }: any) => {
  const truncateText = (text: string, maxLength = 24) => {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '…' : text;
  };

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="end" fill="currentColor" transform="rotate(-35)" fontSize={12}>
        {truncateText(payload.value)}
      </text>
    </g>
  );
};

export function ChartEmptyState({ message = 'No data available for the selected view.' }: { message?: string }) {
  return <div className="flex h-72 w-full items-center justify-center sm:h-84 lg:h-96">{message}</div>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CustomLabelListContent = (props: any) => {
  const { x, y, width, height, offset, value, isSmallScreen, formatValue } = props;
  if (!value || value === 0) {
    return null;
  }

  const formatted = formatValue ? formatValue(value) : formatCompactCurrency(value, 1);

  return (
    <text
      x={x + width / 2}
      y={y + height / 2 + (isSmallScreen ? offset : 0)}
      fill="var(--foreground)"
      textAnchor="middle"
      dominantBaseline="middle"
      className="text-xs sm:text-sm"
    >
      <tspan className="font-semibold">{formatted}</tspan>
    </text>
  );
};

export function getBarChartTickConfig(
  dataLength: number,
  isSmallScreen: boolean,
  foregroundMutedColor: string
): { tick: typeof CustomizedAxisTick | { fill: string }; bottomMargin: number } {
  const shouldUseCustomTick = dataLength > 3 || (isSmallScreen && dataLength > 1);
  return { tick: shouldUseCustomTick ? CustomizedAxisTick : { fill: foregroundMutedColor }, bottomMargin: shouldUseCustomTick ? 100 : 25 };
}

export function BarChartContainer({ children }: { children: ReactNode }) {
  return (
    <div className="h-full min-h-72 w-full sm:min-h-84 lg:min-h-96 [&_g:focus]:outline-none [&_svg:focus]:outline-none">{children}</div>
  );
}

export function TimeSeriesChartContainer({ ref, children }: { ref?: Ref<HTMLDivElement>; children: ReactNode }) {
  return (
    <div ref={ref} className="h-72 w-full sm:h-84 lg:h-96 [&_g:focus]:outline-none [&_svg:focus]:outline-none">
      {children}
    </div>
  );
}

export function TooltipContainer({
  label,
  startAge,
  header,
  children,
  footer,
}: {
  label: number;
  startAge: number;
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (label - Math.floor(startAge));

  return (
    <div className="text-foreground bg-background rounded-lg border p-2 shadow-md">
      <p className="mx-1 mb-2 flex justify-between text-sm font-semibold">
        <span className="mr-2">Age {label}</span>
        <span className="text-muted-foreground ml-1">{yearForAge}</span>
      </p>
      {header}
      {children}
      {footer}
    </div>
  );
}

export function TooltipEntryRow({ dataKey, color, formattedValue }: { dataKey: string; color: string; formattedValue: string | number }) {
  return (
    <p
      style={{ backgroundColor: color }}
      className={cn('border-foreground/50 flex justify-between rounded-lg border px-2 text-sm', {
        'text-background': NEEDS_BG_TEXT_COLORS.includes(color),
      })}
    >
      <span className="mr-2">{`${formatChartString(dataKey)}:`}</span>
      <span className="ml-1 font-semibold">{formattedValue}</span>
    </p>
  );
}

export function ChartGrid() {
  const { gridColor } = useChartTheme();
  return <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />;
}

export function TimeSeriesXAxis({ interval }: { interval: number }) {
  const { foregroundMutedColor } = useChartTheme();
  return <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} dataKey="age" interval={interval} />;
}

export function TimeSeriesYAxis({ formatter }: { formatter?: (value: number) => string }) {
  const { foregroundMutedColor } = useChartTheme();
  const isSmallScreen = useIsMobile();
  return <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} hide={isSmallScreen} tickFormatter={formatter} />;
}

export function BarChartXAxis({ tick }: { tick: typeof CustomizedAxisTick | { fill: string } }) {
  return <XAxis tick={tick} axisLine={false} dataKey="name" interval={0} />;
}

export function BarChartYAxis({ formatter }: { formatter?: (value: number) => string }) {
  const { foregroundMutedColor } = useChartTheme();
  const isSmallScreen = useIsMobile();
  return <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} hide={isSmallScreen} tickFormatter={formatter} />;
}

export function StandardBar({
  data,
  formatValue,
}: {
  data: Array<{ name: string; amount: number; color: string }>;
  formatValue?: (value: number) => string;
}) {
  const isSmallScreen = useIsMobile();
  return (
    <Bar
      dataKey="amount"
      maxBarSize={75}
      minPointSize={20}
      label={<CustomLabelListContent isSmallScreen={isSmallScreen} formatValue={formatValue} />}
    >
      {data.map((entry, i) => (
        <Cell key={`${entry.name}-${i}`} fill={entry.color} fillOpacity={0.5} stroke={entry.color} strokeWidth={3} />
      ))}
    </Bar>
  );
}

export function LineSeries({ dataKeys, strokeColors }: { dataKeys: string[]; strokeColors: string[] }) {
  const { backgroundColor } = useChartTheme();
  return (
    <>
      {dataKeys.map((dataKey, i) => (
        <Line
          key={`line-${dataKey}-${i}`}
          type="monotone"
          dataKey={dataKey}
          stroke={strokeColors[i]}
          activeDot={{ stroke: backgroundColor, strokeWidth: 2 }}
          dot={{ fill: backgroundColor, strokeWidth: 2 }}
          strokeWidth={2}
          strokeOpacity={1}
        />
      ))}
    </>
  );
}

export function BarSeries({ dataKeys, barColors, stackId }: { dataKeys: string[]; barColors: string[]; stackId: string | undefined }) {
  return (
    <>
      {dataKeys.map((dataKey, i) => (
        <Bar key={`bar-${dataKey}-${i}`} dataKey={dataKey} maxBarSize={20} stackId={stackId} fill={barColors[i]} />
      ))}
    </>
  );
}

export function AreaSeries({ dataKeys, areaColors, stackId }: { dataKeys: string[]; areaColors: string[]; stackId: string | undefined }) {
  return (
    <>
      {dataKeys.map((dataKey, i) => (
        <Area
          key={`area-${dataKey}-${i}`}
          type="monotone"
          dataKey={dataKey}
          stackId={stackId}
          stroke={areaColors[i]}
          fill={areaColors[i]}
          fillOpacity={1}
          activeDot={false}
        />
      ))}
    </>
  );
}

export function SignReferenceLine() {
  const { foregroundColor } = useChartTheme();
  return <ReferenceLine y={0} stroke={foregroundColor} strokeWidth={1} ifOverflow="extendDomain" />;
}

export function AgeReferenceLines({
  keyMetrics,
  showReferenceLines = true,
  selectedAge,
}: {
  keyMetrics: KeyMetrics;
  showReferenceLines?: boolean;
  selectedAge: number;
}) {
  const { foregroundMutedColor } = useChartTheme();
  return (
    <>
      {keyMetrics.retirementAge && showReferenceLines && (
        <ReferenceLine x={Math.round(keyMetrics.retirementAge)} stroke={foregroundMutedColor} strokeDasharray="10 5" />
      )}
      {selectedAge && <ReferenceLine x={selectedAge} stroke={foregroundMutedColor} strokeWidth={1.5} ifOverflow="visible" />}
    </>
  );
}
