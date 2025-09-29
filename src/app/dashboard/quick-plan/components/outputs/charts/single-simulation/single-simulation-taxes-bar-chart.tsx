'use client';

import { useTheme } from 'next-themes';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, Cell, ReferenceLine, Tooltip } from 'recharts';

import { formatNumber, formatChartString } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClickDetection } from '@/hooks/use-outside-click';
import type { SingleSimulationTaxesChartDataPoint } from '@/lib/types/chart-data-points';
import { INCOME_TAX_BRACKETS_SINGLE, CAPITAL_GAINS_TAX_BRACKETS_SINGLE } from '@/lib/calc/v2/taxes';
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
  age: number;
  disabled: boolean;
  dataView: 'marginalRates' | 'effectiveRates' | 'annualAmounts' | 'totalAmounts' | 'netIncome' | 'taxableIncome';
}

const CustomTooltip = ({ active, payload, startAge, age, disabled, dataView }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled || dataView !== 'taxableIncome') return null;

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (age - startAge);

  const needsBgTextColor = ['var(--chart-3)', 'var(--chart-4)'];

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

  const header = (
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

  return (
    <div className="text-foreground bg-background rounded-lg border p-2 shadow-md">
      <p className="mx-1 mb-2 flex justify-between text-sm font-semibold">
        <span>Age {age}</span>
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
            <span className="ml-1 font-semibold">{formatNumber(entry.value, 1, '$')}</span>
          </p>
        ))}
        <p
          style={{ backgroundColor: 'var(--chart-3)' }}
          className={`border-foreground/50 text-background flex justify-between rounded-lg border px-2 text-sm`}
        >
          <span className="mr-2">{`${formatChartString('totalTaxableIncome')}:`}</span>
          <span className="ml-1 font-semibold">{formatNumber(entry.totalTaxableIncome, 1, '$')}</span>
        </p>
      </div>
    </div>
  );
};

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
  referenceLineMode: 'hideReferenceLines' | 'marginalCapGainsTaxRates' | 'marginalIncomeTaxRates' | null;
  startAge: number;
}

export default function SingleSimulationTaxesBarChart({
  age,
  dataView,
  rawChartData,
  referenceLineMode,
  startAge,
}: SingleSimulationTaxesBarChartProps) {
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const chartRef = useClickDetection<HTMLDivElement>(
    () => setClickedOutsideChart(true),
    () => setClickedOutsideChart(false)
  );

  const chartData = rawChartData.filter((item) => item.age === age);

  let formatter = undefined;
  let transformedChartData: { name: string; [key: string]: number | string | Record<string, number> }[] = [];
  let dataKeys: string[] = ['amount'];

  let isStacked = false;
  const stackedColors: string[] = [];

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
      let hasOrdinaryIncome = false;
      let hasCapGains = false;
      transformedChartData = chartData.map((item) => {
        hasOrdinaryIncome = item.taxableOrdinaryIncome > 0 || hasOrdinaryIncome;
        hasCapGains = item.taxableCapGains > 0 || hasCapGains;
        return {
          name: 'Taxable Income',
          taxableOrdinaryIncome: item.taxableOrdinaryIncome,
          taxableCapGains: item.taxableCapGains,
          grossIncome: item.grossIncome,
          totalTaxableIncome: item.totalTaxableIncome,
          adjustments: item.adjustments,
          deductions: item.deductions,
        };
      });
      formatter = (value: number) => formatNumber(value, 1, '$');
      dataKeys = [];
      if (hasOrdinaryIncome) {
        dataKeys.push('taxableOrdinaryIncome');
        stackedColors.push(COLORS[0]);
      }
      if (hasCapGains) {
        dataKeys.push('taxableCapGains');
        stackedColors.push(COLORS[1]);
      }
      isStacked = true;
      break;
  }

  if (transformedChartData.length === 0) {
    return <div className="flex h-64 w-full items-center justify-center sm:h-72 lg:h-80">No data available for the selected view.</div>;
  }

  const gridColor = resolvedTheme === 'dark' ? '#44403c' : '#d6d3d1'; // stone-700 : stone-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f5f5f4' : '#1c1917'; // stone-100 : stone-900
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d6d3d1' : '#57534e'; // stone-300 : stone-600

  const shouldUseCustomTick = transformedChartData.length > 5 || isSmallScreen;
  const tick = shouldUseCustomTick ? CustomizedAxisTick : { fill: foregroundMutedColor };
  const bottomMargin = shouldUseCustomTick ? 50 : 0;

  return (
    <div>
      <div ref={chartRef} className="h-64 w-full sm:h-72 lg:h-80 [&_svg:focus]:outline-none">
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
            {!isStacked && (
              <Bar dataKey="amount" maxBarSize={250} minPointSize={20}>
                {transformedChartData.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={COLORS[idx % COLORS.length]}
                    stroke={COLORS[idx % COLORS.length]}
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
            )}
            {isStacked &&
              dataKeys.map((dataKey, idx) => (
                <Bar
                  key={`${dataKey}-${idx}`}
                  dataKey={dataKey}
                  stackId="stack"
                  maxBarSize={250}
                  minPointSize={20}
                  fill={stackedColors[idx]}
                  stroke={stackedColors[idx]}
                  strokeWidth={3}
                  fillOpacity={0.5}
                >
                  <LabelList
                    dataKey={dataKey}
                    position="middle"
                    content={<CustomLabelListContent isSmallScreen={isSmallScreen} dataView={dataView} />}
                  />
                </Bar>
              ))}
            {dataView === 'taxableIncome' && (
              <Tooltip
                content={
                  <CustomTooltip startAge={startAge} age={age} disabled={isSmallScreen && clickedOutsideChart} dataView={dataView} />
                }
                cursor={false}
              />
            )}
            {referenceLineMode === 'marginalIncomeTaxRates' &&
              INCOME_TAX_BRACKETS_SINGLE.map((bracket, index) => (
                <ReferenceLine
                  key={index}
                  y={bracket.min}
                  stroke={foregroundMutedColor}
                  label={{
                    value: `${(bracket.rate * 100).toFixed(0)}% (${formatNumber(bracket.min, 1, '$')})`,
                    position: 'insideBottomRight',
                    fill: foregroundColor,
                    fontWeight: '600',
                  }}
                />
              ))}
            {referenceLineMode === 'marginalCapGainsTaxRates' &&
              CAPITAL_GAINS_TAX_BRACKETS_SINGLE.map((bracket, index) => (
                <ReferenceLine
                  key={index}
                  y={bracket.min}
                  stroke={foregroundMutedColor}
                  label={{
                    value: `${(bracket.rate * 100).toFixed(0)}% (${formatNumber(bracket.min, 1, '$')})`,
                    position: 'insideBottomRight',
                    fill: foregroundColor,
                    fontWeight: '600',
                  }}
                />
              ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
