import { cn, formatChartString } from '@/lib/utils';

interface TimeSeriesLegendProps {
  colors: string[];
  legendStrokeColor: string;
  dataKeys: string[];
  isSmallScreen: boolean;
}

export default function TimeSeriesLegend({ colors, legendStrokeColor, dataKeys, isSmallScreen }: TimeSeriesLegendProps) {
  const useGridLayout = dataKeys.length >= 4 || isSmallScreen;

  return (
    <div
      className={cn('divide-border/50 mt-2 gap-2 divide-x sm:gap-x-4', {
        'ml-16': !isSmallScreen,
        'grid grid-cols-2': useGridLayout,
        'sm:flex sm:justify-center': !useGridLayout,
      })}
      role="group"
      aria-label="Chart legend"
    >
      {dataKeys.map((dataKey, index) => (
        <div key={dataKey} className="flex items-center gap-x-2 pr-4 text-sm font-medium">
          <svg viewBox="0 0 6 6" aria-hidden="true" style={{ fill: colors[index % colors.length] }} className="size-5 shrink-0">
            <rect x={0.5} y={0.5} width={5} height={5} stroke={legendStrokeColor} strokeWidth={0.5} paintOrder="stroke" />
          </svg>
          <span className="truncate">{formatChartString(dataKey)}</span>
        </div>
      ))}
    </div>
  );
}
