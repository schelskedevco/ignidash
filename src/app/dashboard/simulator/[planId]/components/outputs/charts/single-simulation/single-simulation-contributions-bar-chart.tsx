'use client';

import { useTheme } from 'next-themes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';

import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SingleSimulationContributionsChartDataPoint } from '@/lib/types/chart-data-points';
import type { ContributionsDataView } from '@/lib/types/chart-data-views';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomLabelListContent = (props: any) => {
  const { x, y, width, height, offset, value, isSmallScreen } = props;
  if (!value || value === 0) {
    return null;
  }

  return (
    <text
      x={x + width / 2}
      y={y + height / 2 + (isSmallScreen ? offset : 0)}
      fill="var(--foreground)"
      textAnchor="middle"
      dominantBaseline="middle"
      className="text-xs sm:text-sm"
    >
      <tspan className="font-semibold">{formatNumber(value, 1, '$')}</tspan>
    </text>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomizedAxisTick = ({ x, y, stroke, payload }: any) => {
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

interface SingleSimulationContributionsBarChartProps {
  age: number;
  dataView: ContributionsDataView;
  rawChartData: SingleSimulationContributionsChartDataPoint[];
  customDataID: string;
}

export default function SingleSimulationContributionsBarChart({
  age,
  dataView,
  rawChartData,
  customDataID,
}: SingleSimulationContributionsBarChartProps) {
  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const labelConfig: Record<string, { mobile: string[]; desktop: string[] }> = {
    annualAmounts: {
      mobile: ['Stock Contrib.', 'Bond Contrib.', 'Cash Contrib.'],
      desktop: ['Annual Stock Contrib.', 'Annual Bond Contrib.', 'Annual Cash Contrib.'],
    },
    cumulativeAmounts: {
      mobile: ['Cumul. Stock', 'Cumul. Bond', 'Cumul. Cash'],
      desktop: ['Cumul. Stock Contrib.', 'Cumul. Bond Contrib.', 'Cumul. Cash Contrib.'],
    },
    taxCategory: {
      mobile: ['Taxable', 'Tax-Deferred', 'Tax-Free', 'Cash'],
      desktop: ['Taxable Contrib.', 'Tax-Deferred Contrib.', 'Tax-Free Contrib.', 'Cash Contrib.'],
    },
    employerMatch: {
      mobile: ['Annual Match', 'Cumul. Match'],
      desktop: ['Annual Employer Match', 'Cumul. Employer Match'],
    },
    shortfall: {
      mobile: ['Shortfall Repaid', 'Outstanding Shortfall'],
      desktop: ['Annual Shortfall Repaid', 'Outstanding Shortfall'],
    },
  };

  const getLabelsForScreenSize = (dataView: keyof typeof labelConfig, isSmallScreen: boolean) => {
    return labelConfig[dataView][isSmallScreen ? 'mobile' : 'desktop'];
  };

  const chartData = rawChartData.filter((item) => item.age === age);

  const formatter = (value: number) => formatNumber(value, 1, '$');
  let transformedChartData: { name: string; amount: number; color: string }[] = [];

  switch (dataView) {
    case 'annualAmounts': {
      const [annualStockLabel, annualBondLabel, annualCashLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: annualStockLabel, amount: item.annualStockContributions, color: 'var(--chart-1)' },
        { name: annualBondLabel, amount: item.annualBondContributions, color: 'var(--chart-2)' },
        { name: annualCashLabel, amount: item.annualCashContributions, color: 'var(--chart-3)' },
      ]);
      break;
    }
    case 'cumulativeAmounts': {
      const [cumulativeStockLabel, cumulativeBondLabel, cumulativeCashLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: cumulativeStockLabel, amount: item.cumulativeStockContributions, color: 'var(--chart-1)' },
        { name: cumulativeBondLabel, amount: item.cumulativeBondContributions, color: 'var(--chart-2)' },
        { name: cumulativeCashLabel, amount: item.cumulativeCashContributions, color: 'var(--chart-3)' },
      ]);
      break;
    }
    case 'taxCategory': {
      const [taxableLabel, taxDeferredLabel, taxFreeLabel, cashLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: taxableLabel, amount: item.taxableContributions, color: 'var(--chart-1)' },
        { name: taxDeferredLabel, amount: item.taxDeferredContributions, color: 'var(--chart-2)' },
        { name: taxFreeLabel, amount: item.taxFreeContributions, color: 'var(--chart-3)' },
        { name: cashLabel, amount: item.cashSavingsContributions, color: 'var(--chart-4)' },
      ]);
      break;
    }
    case 'employerMatch': {
      const [annualMatchLabel, cumulativeMatchLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: annualMatchLabel, amount: item.annualEmployerMatch, color: 'var(--chart-2)' },
        { name: cumulativeMatchLabel, amount: item.cumulativeEmployerMatch, color: 'var(--chart-4)' },
      ]);
      break;
    }
    case 'shortfall': {
      const [shortfallRepaidLabel, outstandingShortfallLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: shortfallRepaidLabel, amount: item.annualShortfallRepaid, color: 'var(--chart-2)' },
        { name: outstandingShortfallLabel, amount: item.outstandingShortfall, color: 'var(--chart-4)' },
      ]);
      break;
    }
    case 'custom': {
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        break;
      }

      transformedChartData = chartData
        .flatMap(({ perAccountData }) => perAccountData)
        .filter(({ id }) => id === customDataID)
        .flatMap(({ name, contributions }) => [
          { name: `${name} — Stock Contrib.`, amount: contributions.stocks, color: 'var(--chart-1)' },
          { name: `${name} — Bond Contrib.`, amount: contributions.bonds, color: 'var(--chart-2)' },
          { name: `${name} — Cash Contrib.`, amount: contributions.cash, color: 'var(--chart-3)' },
        ]);
      break;
    }
  }

  transformedChartData = transformedChartData.sort((a, b) => b.amount - a.amount);
  if (transformedChartData.length === 0) {
    return <div className="flex h-72 w-full items-center justify-center sm:h-84 lg:h-96">No data available for the selected view.</div>;
  }

  const gridColor = resolvedTheme === 'dark' ? '#44403c' : '#d6d3d1'; // stone-700 : stone-300
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d6d3d1' : '#57534e'; // stone-300 : stone-600

  const shouldUseCustomTick = transformedChartData.length > 3 || (isSmallScreen && transformedChartData.length > 1);
  const tick = shouldUseCustomTick ? CustomizedAxisTick : { fill: foregroundMutedColor };
  const bottomMargin = shouldUseCustomTick ? 100 : 25;

  return (
    <div className="h-full min-h-72 w-full sm:min-h-84 lg:min-h-96 [&_g:focus]:outline-none [&_svg:focus]:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={transformedChartData}
          className="text-xs"
          margin={{ top: 5, right: 10, left: 10, bottom: bottomMargin }}
          tabIndex={-1}
        >
          <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
          <XAxis tick={tick} axisLine={false} dataKey="name" interval={0} />
          <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} hide={isSmallScreen} tickFormatter={formatter} />
          <Bar dataKey="amount" maxBarSize={75} minPointSize={20} label={<CustomLabelListContent isSmallScreen={isSmallScreen} />}>
            {transformedChartData.map((entry, i) => (
              <Cell key={`${entry.name}-${i}`} fill={entry.color} fillOpacity={0.5} stroke={entry.color} strokeWidth={3} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
