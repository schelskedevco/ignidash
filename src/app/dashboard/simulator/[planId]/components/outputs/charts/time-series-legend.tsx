'use client';

import { cn, formatChartString } from '@/lib/utils';

interface TimeSeriesLegendProps {
  colors: string[];
  legendStrokeColor: string;
  dataKeys: string[];
  isSmallScreen: boolean;
  onMouseEnter?: (dataKey: string) => void;
  onMouseLeave?: () => void;
}

export default function TimeSeriesLegend({
  colors,
  legendStrokeColor,
  dataKeys,
  isSmallScreen,
  onMouseEnter,
  onMouseLeave,
}: TimeSeriesLegendProps) {
  const useGridLayout = dataKeys.length >= 4 || isSmallScreen;

  return (
    <div
      className={cn('divide-border/50 mt-2 gap-x-4 gap-y-2 divide-x', {
        'ml-16': !isSmallScreen,
        'grid grid-cols-2': useGridLayout,
        'sm:flex sm:justify-center': !useGridLayout,
      })}
      role="group"
      aria-label="Chart legend"
    >
      {dataKeys.map((dataKey, index) => (
        <div
          key={dataKey}
          className={cn('flex cursor-default items-center gap-x-2 pr-4 text-sm font-medium', {
            'border-border/50 last:border-r': useGridLayout,
          })}
          onMouseEnter={() => onMouseEnter?.(dataKey)}
          onMouseLeave={() => onMouseLeave?.()}
        >
          <svg viewBox="0 0 6 6" aria-hidden="true" style={{ fill: colors[index % colors.length] }} className="size-5 shrink-0">
            <rect x={0.5} y={0.5} width={5} height={5} stroke={legendStrokeColor} strokeWidth={0.5} paintOrder="stroke" />
          </svg>
          <span className="line-clamp-2 tracking-tighter sm:tracking-normal">{formatChartString(dataKey)}</span>
        </div>
      ))}
    </div>
  );
}
