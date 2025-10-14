'use client';

import { useTheme } from 'next-themes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, Cell /* Tooltip */ } from 'recharts';

import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SingleSimulationWithdrawalsChartDataPoint } from '@/lib/types/chart-data-points';

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
      fill="currentColor"
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

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

interface SingleSimulationWithdrawalsBarChartProps {
  age: number;
  dataView:
    | 'annualAmounts'
    | 'cumulativeAmounts'
    | 'taxCategory'
    | 'realizedGains'
    | 'requiredMinimumDistributions'
    | 'earlyWithdrawalPenalties'
    | 'earlyWithdrawals'
    | 'withdrawalRate'
    | 'custom';
  rawChartData: SingleSimulationWithdrawalsChartDataPoint[];
  customDataID: string;
}

export default function SingleSimulationWithdrawalsBarChart({
  age,
  dataView,
  rawChartData,
  customDataID,
}: SingleSimulationWithdrawalsBarChartProps) {
  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const labelConfig: Record<string, { mobile: string[]; desktop: string[] }> = {
    taxCategory: {
      mobile: ['Taxable', 'Tax-Deferred', 'Tax-Free', 'Cash'],
      desktop: ['Taxable Withdrawals', 'Tax-Deferred Withdrawals', 'Tax-Free Withdrawals', 'Cash Withdrawals'],
    },
    realizedGains: {
      mobile: ['Annual Gains', 'Cumulative Gains'],
      desktop: ['Annual Realized Gains', 'Cumulative Realized Gains'],
    },
    earlyWithdrawalPenalties: {
      mobile: ['Annual EW Penalty', 'Cumul. EW Penalty'],
      desktop: ['Annual EW Penalties', 'Cumulative EW Penalties'],
    },
    earlyWithdrawals: {
      mobile: ['Annual EWs', 'Cumulative EWs'],
      desktop: ['Annual Early Withdrawals', 'Cumulative Early Withdrawals'],
    },
  };

  const getLabelsForScreenSize = (dataView: keyof typeof labelConfig, isSmallScreen: boolean) => {
    return labelConfig[dataView][isSmallScreen ? 'mobile' : 'desktop'];
  };

  const chartData = rawChartData.filter((item) => item.age === age);

  let transformedChartData: { name: string; amount: number }[] = [];
  switch (dataView) {
    case 'annualAmounts':
      transformedChartData = chartData.flatMap((item) => [{ name: 'Annual Withdrawals', amount: item.annualWithdrawals }]);
      break;
    case 'cumulativeAmounts':
      transformedChartData = chartData.flatMap((item) => [{ name: 'Cumulative Withdrawals', amount: item.cumulativeWithdrawals }]);
      break;
    case 'taxCategory': {
      const [taxableLabel, taxDeferredLabel, taxFreeLabel, cashLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: taxableLabel, amount: item.taxableWithdrawals },
        { name: taxDeferredLabel, amount: item.taxDeferredWithdrawals },
        { name: taxFreeLabel, amount: item.taxFreeWithdrawals },
        { name: cashLabel, amount: item.cashWithdrawals },
      ]);
      break;
    }
    case 'realizedGains': {
      const [annualLabel, cumulativeLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: annualLabel, amount: item.annualRealizedGains },
        { name: cumulativeLabel, amount: item.cumulativeRealizedGains },
      ]);
      break;
    }
    case 'requiredMinimumDistributions':
      transformedChartData = chartData.flatMap((item) => [
        { name: 'Annual RMDs', amount: item.annualRequiredMinimumDistributions },
        { name: 'Cumulative RMDs', amount: item.cumulativeRequiredMinimumDistributions },
      ]);
      break;
    case 'earlyWithdrawalPenalties': {
      const [annualLabel, cumulativeLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: annualLabel, amount: item.annualEarlyWithdrawalPenalties },
        { name: cumulativeLabel, amount: item.cumulativeEarlyWithdrawalPenalties },
      ]);
      break;
    }
    case 'earlyWithdrawals': {
      const [annualLabel, cumulativeLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: annualLabel, amount: item.annualEarlyWithdrawals },
        { name: cumulativeLabel, amount: item.cumulativeEarlyWithdrawals },
      ]);
      break;
    }
    case 'withdrawalRate':
      break;
    case 'custom':
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        transformedChartData = [];
        break;
      }

      transformedChartData = [
        ...chartData
          .flatMap(({ perAccountData }) =>
            perAccountData.map(({ id, name, withdrawalsForPeriod }) => ({ id, name, amount: withdrawalsForPeriod }))
          )
          .filter(({ id }) => id === customDataID),
      ];
      break;
  }

  if (transformedChartData.length === 0) {
    return <div className="flex h-64 w-full items-center justify-center sm:h-72 lg:h-80">No data available for the selected view.</div>;
  }

  const gridColor = resolvedTheme === 'dark' ? '#44403c' : '#d6d3d1'; // stone-700 : stone-300
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d6d3d1' : '#57534e'; // stone-300 : stone-600

  const shouldUseCustomTick = transformedChartData.length > 5 || (isSmallScreen && transformedChartData.length > 1);
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
            <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
            <XAxis tick={tick} axisLine={false} tickLine={false} dataKey="name" interval={0} />
            <YAxis
              tick={{ fill: foregroundMutedColor }}
              axisLine={false}
              tickLine={false}
              hide={isSmallScreen}
              tickFormatter={(value: number) => formatNumber(value, 1, '$')}
            />
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
              <LabelList dataKey="amount" position="middle" content={<CustomLabelListContent isSmallScreen={isSmallScreen} />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
