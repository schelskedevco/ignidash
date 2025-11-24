'use client';

import { Pie, PieChart, ResponsiveContainer, Sector, SectorProps, Cell } from 'recharts';

import { formatNumber, formatChartString } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

type Coordinate = {
  x: number;
  y: number;
};

type Payload = {
  name: string;
  value: number;
  fill: string;
  stroke: string;
};

type PieSectorData = {
  percent?: number;
  name?: string | number;
  midAngle?: number;
  middleRadius?: number;
  tooltipPosition?: Coordinate;
  value?: number;
  paddingAngle?: number;
  dataKey?: string;
  payload?: Payload;
};

type PieSectorDataItem = React.SVGProps<SVGPathElement> & Partial<SectorProps> & PieSectorData;

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

const createRenderActiveShape = (isSmallScreen: boolean) => {
  const RenderActiveShape = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  }: PieSectorDataItem) => {
    return (
      <g>
        <text
          x={cx}
          y={cy}
          dy={-20}
          textAnchor="middle"
          fill="currentColor"
          fontSize="14"
        >{`${value !== undefined ? formatNumber(value, 2, '$') : 'N/A'}`}</text>
        <text x={cx} y={cy} dy={0} textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="600">
          {formatChartString(payload?.name ?? 'N/A')}
        </text>
        <text x={cx} y={cy} dy={20} textAnchor="middle" fill="var(--muted-foreground)" fontSize="14">
          {`${((percent ?? 1) * 100).toFixed(1)}%`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={(outerRadius ?? 0) + 6}
          outerRadius={(outerRadius ?? 0) + 10}
          fill={fill}
        />
      </g>
    );
  };

  RenderActiveShape.displayName = 'RenderActiveShape';
  return RenderActiveShape;
};

interface SingleSimulationPortfolioPieChartProps {
  chartData: { name: string; value: number }[];
}

export default function SingleSimulationPortfolioPieChart({ chartData }: SingleSimulationPortfolioPieChartProps) {
  const isSmallScreen = useIsMobile();

  if (chartData.reduce((sum, item) => sum + item.value, 0) === 0) {
    return <div className="flex h-64 w-full items-center justify-center sm:h-72 lg:h-80">No data available for the selected view.</div>;
  }

  return (
    <div className="flex items-center">
      <div className="h-64 w-full sm:h-72 lg:h-80 [&_svg:focus]:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart className="text-xs">
            <Pie
              activeShape={createRenderActiveShape(isSmallScreen)}
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={100}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} stroke="currentColor" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
