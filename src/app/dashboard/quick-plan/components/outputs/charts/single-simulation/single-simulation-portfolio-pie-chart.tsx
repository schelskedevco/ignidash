'use client';

import { Pie, PieChart, ResponsiveContainer, Sector, SectorProps, Cell } from 'recharts';

import { formatNumber } from '@/lib/utils';

interface SingleSimulationPortfolioAccountTypePieChartDataPoint {
  age: number;
  taxable: number;
  taxDeferred: number;
  taxFree: number;
  savings: number;
}

interface SingleSimulationPortfolioAssetTypePieChartDataPoint {
  age: number;
  stocks: number;
  bonds: number;
  cash: number;
}

type SingleSimulationPortfolioPieChartDataPoint =
  | SingleSimulationPortfolioAccountTypePieChartDataPoint
  | SingleSimulationPortfolioAssetTypePieChartDataPoint;

type Coordinate = {
  x: number;
  y: number;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
};

type PieSectorDataItem = React.SVGProps<SVGPathElement> & Partial<SectorProps> & PieSectorData;

const COLORS = ['var(--chart-3)', 'var(--chart-2)', 'var(--chart-1)', 'var(--chart-4)'];

const renderActiveShape = ({
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
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill="currentColor">
        {formatString(payload.name)}
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
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
      >{`${formatString(payload.name)}: ${value !== undefined ? formatNumber(value) : 'N/A'}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="currentColor">
        {`${((percent ?? 1) * 100).toFixed(2)}% of Net Worth`}
      </text>
    </g>
  );
};

type GeometrySector = {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
};

type PieLabelProps = PieSectorData &
  GeometrySector & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tooltipPayload?: any;
  };

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, tooltipPayload }: PieLabelProps) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
  const y = cy + radius * Math.sin(-(midAngle ?? 0) * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${((percent ?? 1) * 100).toFixed(0)}%`}
    </text>
  );
};

interface SingleSimulationPortfolioPieChartProps {
  rawChartData: SingleSimulationPortfolioPieChartDataPoint[];
  selectedAge: number;
}

export default function SingleSimulationPortfolioPieChart({ rawChartData, selectedAge }: SingleSimulationPortfolioPieChartProps) {
  const chartData = rawChartData
    .filter((data) => data.age === selectedAge)
    .flatMap(({ age, ...rest }) => Object.entries(rest).map(([name, value]) => ({ name, value })));

  return (
    <div className="h-64 w-full sm:h-72 lg:h-80 [&_svg:focus]:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart className="text-xs">
          <Pie
            activeShape={renderActiveShape}
            labelLine={false}
            label={renderCustomizedLabel}
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            paddingAngle={10}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatString(input: string): string {
  const withSpaces = input.replace(/(?<!^)([A-Z])/g, ' $1');
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}
