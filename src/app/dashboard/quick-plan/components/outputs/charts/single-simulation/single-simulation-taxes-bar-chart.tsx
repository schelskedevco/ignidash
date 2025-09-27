'use client';

import { useTheme } from 'next-themes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, Cell /* Tooltip */ } from 'recharts';

import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SingleSimulationTaxesChartDataPoint } from '@/lib/types/chart-data-points';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomLabelListContent = (props: any) => {
  const { x, y, width, height, offset, value, isSmallScreen, dataView } = props;
  if (!value || value === 0) {
    return null;
  }

  const formatValue = (
    value: number,
    mode: 'marginalRates' | 'effectiveRates' | 'annualAmounts' | 'totalAmounts' | 'netIncome' | 'taxableIncome'
  ) => {
    switch (mode) {
      case 'marginalRates':
      case 'effectiveRates':
        return `${(value * 100).toFixed(2)}%`;
      case 'annualAmounts':
      case 'totalAmounts':
      case 'netIncome':
      case 'taxableIncome':
        return formatNumber(value, 1, '$');
      default:
        return value;
    }
  };

  return (
    <text
      x={x + width / 2}
      y={y + height / 2 + (isSmallScreen ? offset : 0)}
      fill="currentColor"
      textAnchor="middle"
      dominantBaseline="middle"
      className="text-xs sm:text-sm"
    >
      <tspan className="font-semibold">{formatValue(value, dataView)}</tspan>
    </text>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomizedAxisTick = ({ x, y, stroke, payload }: any) => {
  const truncateText = (text: string, maxLength = 18) => {
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

const COLORS = ['var(--chart-2)', 'var(--chart-4)', 'var(--chart-3)', 'var(--chart-1)'];

interface SingleSimulationTaxesBarChartProps {
  age: number;
  dataView: 'marginalRates' | 'effectiveRates' | 'annualAmounts' | 'totalAmounts' | 'netIncome' | 'taxableIncome';
  rawChartData: SingleSimulationTaxesChartDataPoint[];
}

export default function SingleSimulationTaxesBarChart({ age, dataView, rawChartData }: SingleSimulationTaxesBarChartProps) {
  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const chartData = rawChartData.filter((item) => item.age === age);

  let formatter = undefined;
  let transformedChartData: { name: string; amount: number }[] = [];
  switch (dataView) {
    case 'marginalRates':
      transformedChartData = chartData.flatMap((item) => [
        { name: 'Top Marginal Income Tax Rate', amount: item.topMarginalIncomeTaxRate },
        { name: 'Top Marginal Cap Gains Tax Rate', amount: item.topMarginalCapGainsTaxRate },
      ]);
      formatter = (value: number) => `${(value * 100).toFixed(2)}%`;
      break;
    case 'effectiveRates':
      transformedChartData = chartData.flatMap((item) => [
        { name: 'Effective Income Tax Rate', amount: item.effectiveIncomeTaxRate },
        { name: 'Effective Cap Gains Tax Rate', amount: item.effectiveCapGainsTaxRate },
      ]);
      formatter = (value: number) => `${(value * 100).toFixed(2)}%`;
      break;
    case 'annualAmounts':
      transformedChartData = chartData.flatMap((item) => [
        { name: 'Income Tax Amount', amount: item.annualIncomeTaxAmount },
        { name: 'Cap Gains Tax Amount', amount: item.annualCapGainsTaxAmount },
        { name: 'Total Tax Amount', amount: item.totalAnnualTaxAmount },
      ]);
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    case 'totalAmounts':
      transformedChartData = chartData.flatMap((item) => [
        { name: 'Total Income Tax Amount', amount: item.totalIncomeTaxAmount },
        { name: 'Total Cap Gains Tax Amount', amount: item.totalCapGainsTaxAmount },
        { name: 'Total Tax Amount', amount: item.totalTaxAmount },
      ]);
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    case 'netIncome':
      transformedChartData = chartData.flatMap((item) => [
        { name: 'Net Income', amount: item.netIncome },
        { name: 'Net Cap Gains', amount: item.netCapGains },
        { name: 'Total Net Income', amount: item.totalNetIncome },
      ]);
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    case 'taxableIncome':
      transformedChartData = chartData.flatMap((item) => [
        { name: 'Taxable Ordinary Income', amount: item.taxableOrdinaryIncome },
        { name: 'Taxable Cap Gains', amount: item.taxableCapGains },
        { name: 'Total Taxable Income', amount: item.totalTaxableIncome },
      ]);
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
  }

  if (transformedChartData.length === 0) {
    return <div className="flex h-64 w-full items-center justify-center sm:h-72 lg:h-80">No data available for the selected view.</div>;
  }

  const gridColor = resolvedTheme === 'dark' ? '#44403c' : '#d6d3d1'; // stone-700 : stone-300
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d6d3d1' : '#57534e'; // stone-300 : stone-600

  const shouldUseCustomTick = transformedChartData.length > 5 || isSmallScreen;
  const tick = shouldUseCustomTick ? CustomizedAxisTick : { fill: foregroundMutedColor };
  const bottomMargin = shouldUseCustomTick ? 50 : 0;

  return (
    <div>
      <div className="h-64 w-full sm:h-72 lg:h-80 [&_svg:focus]:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={transformedChartData}
            className="text-xs"
            margin={{ top: 0, right: 10, left: 10, bottom: bottomMargin }}
            tabIndex={-1}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis tick={tick} axisLine={false} dataKey="name" interval={0} />
            <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} hide={isSmallScreen} tickFormatter={formatter} />
            <Bar dataKey="amount" maxBarSize={250} minPointSize={20}>
              {transformedChartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={3}
                  fillOpacity={0.5}
                />
              ))}
              <LabelList
                dataKey="amount"
                position="middle"
                content={<CustomLabelListContent isSmallScreen={isSmallScreen} dataView={dataView} />}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
