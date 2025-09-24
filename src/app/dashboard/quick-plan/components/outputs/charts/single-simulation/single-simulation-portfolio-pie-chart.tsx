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
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * (midAngle ?? 1));
    const cos = Math.cos(-RADIAN * (midAngle ?? 1));
    const sx = (cx ?? 0) + ((outerRadius ?? 0) + 10) * cos;
    const sy = (cy ?? 0) + ((outerRadius ?? 0) + 10) * sin;
    const mx = (cx ?? 0) + ((outerRadius ?? 0) + 30) * cos;
    const my = (cy ?? 0) + ((outerRadius ?? 0) + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

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
          {`${((percent ?? 1) * 100).toFixed(2)}%`}
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
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          textAnchor={textAnchor}
          fill="currentColor"
          fontSize="16"
        >{`${value !== undefined ? formatNumber(value, 2, '$') : 'N/A'}`}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="var(--muted-foreground)" fontSize="14">
          {`${((percent ?? 1) * 100).toFixed(2)}%`}
        </text>
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
