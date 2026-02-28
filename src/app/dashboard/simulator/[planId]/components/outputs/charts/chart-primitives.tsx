import type { ReactNode, Ref } from 'react';

import { formatChartString, cn } from '@/lib/utils';
import { formatCompactCurrency } from '@/lib/utils/currency-formatters';

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
