'use client';

import { useState, useCallback, memo } from 'react';
import { ComposedChart, Tooltip } from 'recharts';
import { ChartLineIcon } from 'lucide-react';

import { formatCompactCurrency } from '@/lib/utils/currency-formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChartTheme } from '@/hooks/use-chart-theme';
import { useClickDetection } from '@/hooks/use-outside-click';
import { useChartDataSlice } from '@/hooks/use-chart-data-slice';
import { useChartInterval } from '@/hooks/use-chart-interval';
import type { SingleSimulationCashFlowChartDataPoint } from '@/lib/types/chart-data-points';
import type { CashFlowDataView } from '@/lib/types/chart-data-views';
import type { IncomeData } from '@/lib/calc/incomes';
import type { ExpenseData } from '@/lib/calc/expenses';
import type { PhysicalAssetData } from '@/lib/calc/physical-assets';
import type { DebtData } from '@/lib/calc/debts';
import type { KeyMetrics } from '@/lib/types/key-metrics';

import {
  ChartEmptyState,
  TimeSeriesChartContainer,
  TooltipContainer,
  TooltipEntryRow,
  ChartGrid,
  TimeSeriesXAxis,
  TimeSeriesYAxis,
  LineSeries,
  BarSeries,
  SignReferenceLine,
  AgeReferenceLines,
} from '../chart-primitives';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof SingleSimulationCashFlowChartDataPoint | keyof IncomeData | keyof ExpenseData | keyof PhysicalAssetData | keyof DebtData;
    payload:
      | SingleSimulationCashFlowChartDataPoint
      | ({ age: number } & IncomeData)
      | ({ age: number } & ExpenseData)
      | ({ age: number } & PhysicalAssetData)
      | ({ age: number } & DebtData);
  }>;
  label?: number;
  startAge: number;
  disabled: boolean;
  dataView: CashFlowDataView;
}

const CustomTooltip = memo(({ active, payload, label, startAge, disabled, dataView }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  const formatValue = (value: number) => {
    return dataView === 'savingsRate' ? `${(value * 100).toFixed(1)}%` : formatCompactCurrency(value, 1);
  };

  const transformedPayload = payload.filter((entry) => entry.color !== LINE_COLOR);

  let footer = null;
  switch (dataView) {
    case 'surplusDeficit':
      const surplusDeficit = payload.find((entry) => entry.dataKey === 'surplusDeficit');
      if (!surplusDeficit) {
        console.error('Surplus/deficit data not found');
        break;
      }

      footer = (
        <p className="mx-1 mt-2 flex justify-between text-sm font-semibold">
          <span className="flex items-center gap-1">
            <ChartLineIcon className="h-3 w-3" />
            <span className="mr-2">Surplus/Deficit:</span>
          </span>
          <span className="ml-1 font-semibold">{formatCompactCurrency(surplusDeficit.value, 3)}</span>
        </p>
      );
      break;
    case 'cashFlow':
      const netCashFlow = payload.find((entry) => entry.dataKey === 'netCashFlow');
      if (!netCashFlow) {
        console.error('Net cash flow data not found');
        break;
      }

      footer = (
        <p className="mx-1 mt-2 flex justify-between text-sm font-semibold">
          <span className="flex items-center gap-1">
            <ChartLineIcon className="h-3 w-3" />
            <span className="mr-2">Net Cash Flow:</span>
          </span>
          <span className="ml-1 font-semibold">{formatCompactCurrency(netCashFlow.value, 3)}</span>
        </p>
      );
      break;
    case 'incomes':
    case 'expenses':
      footer = (
        <p className="mx-1 mt-2 flex justify-between text-sm font-semibold">
          <span className="mr-2">Total:</span>
          <span className="ml-1 font-semibold">
            {formatCompactCurrency(
              payload.reduce((sum, item) => sum + item.value, 0),
              3
            )}
          </span>
        </p>
      );
      break;
    case 'custom':
    case 'savingsRate':
      break;
  }

  return (
    <TooltipContainer label={label!} startAge={startAge} footer={footer}>
      <div className="flex flex-col gap-1">
        {transformedPayload
          .filter((entry) => entry.value !== 0)
          .map((entry) => (
            <TooltipEntryRow key={entry.dataKey} dataKey={entry.dataKey} color={entry.color} formattedValue={formatValue(entry.value)} />
          ))}
      </div>
    </TooltipContainer>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

const LINE_COLOR = 'var(--foreground)';

interface SingleSimulationCashFlowLineChartProps {
  rawChartData: SingleSimulationCashFlowChartDataPoint[];
  startAge: number;
  keyMetrics: KeyMetrics;
  showReferenceLines: boolean;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  dataView: CashFlowDataView;
  customDataID?: string;
}

export default function SingleSimulationCashFlowLineChart({
  rawChartData,
  startAge,
  keyMetrics,
  showReferenceLines,
  onAgeSelect,
  selectedAge,
  dataView,
  customDataID,
}: SingleSimulationCashFlowLineChartProps) {
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

  const { foregroundColor } = useChartTheme();
  const isSmallScreen = useIsMobile();

  const chartRef = useClickDetection<HTMLDivElement>(
    () => setClickedOutsideChart(true),
    () => setClickedOutsideChart(false)
  );

  let chartData:
    | SingleSimulationCashFlowChartDataPoint[]
    | Array<{ age: number } & IncomeData>
    | Array<{ age: number } & ExpenseData>
    | Array<{ age: number } & PhysicalAssetData>
    | Array<{ age: number } & DebtData> = useChartDataSlice(rawChartData, 'single');

  const lineDataKeys: (
    | keyof SingleSimulationCashFlowChartDataPoint
    | keyof IncomeData
    | keyof ExpenseData
    | keyof PhysicalAssetData
    | keyof DebtData
  )[] = [];
  const strokeColors: string[] = [];

  const barDataKeys: (
    | keyof SingleSimulationCashFlowChartDataPoint
    | keyof IncomeData
    | keyof ExpenseData
    | keyof PhysicalAssetData
    | keyof DebtData
  )[] = [];
  const barColors: string[] = [];

  let formatter = undefined;
  let stackOffset: 'sign' | undefined = undefined;

  switch (dataView) {
    case 'surplusDeficit': {
      formatter = (value: number) => formatCompactCurrency(value, 1);

      lineDataKeys.push('surplusDeficit');
      strokeColors.push(LINE_COLOR);

      barDataKeys.push('income', 'expenses', 'taxesAndPenalties', 'debtPayments');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)');

      chartData = chartData.map((entry) => ({
        ...entry,
        expenses: -entry.expenses,
        taxesAndPenalties: -entry.taxesAndPenalties,
        debtPayments: -entry.debtPayments,
      }));

      stackOffset = 'sign';
      break;
    }
    case 'cashFlow': {
      formatter = (value: number) => formatCompactCurrency(value, 1);

      lineDataKeys.push('netCashFlow');
      strokeColors.push(LINE_COLOR);

      barDataKeys.push(
        'income',
        'amountLiquidated',
        'assetSaleProceeds',
        'expenses',
        'taxesAndPenalties',
        'debtPayments',
        'amountInvested',
        'assetPurchaseOutlay'
      );
      barColors.push(
        'var(--chart-1)',
        'var(--chart-2)',
        'var(--chart-3)',
        'var(--chart-4)',
        'var(--chart-5)',
        'var(--chart-6)',
        'var(--chart-7)',
        'var(--chart-8)'
      );

      chartData = chartData.map((entry) => ({
        ...entry,
        expenses: -entry.expenses,
        taxesAndPenalties: -entry.taxesAndPenalties,
        debtPayments: -entry.debtPayments,
        amountInvested: -entry.amountInvested,
        assetPurchaseOutlay: -entry.assetPurchaseOutlay,
      }));

      stackOffset = 'sign';
      break;
    }
    case 'incomes': {
      formatter = (value: number) => formatCompactCurrency(value, 1);

      barDataKeys.push('earnedIncome', 'socialSecurityIncome', 'taxFreeIncome', 'employerMatch');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)');
      break;
    }
    case 'expenses': {
      formatter = (value: number) => formatCompactCurrency(value, 1);

      barDataKeys.push('expenses', 'taxesAndPenalties', 'debtPayments');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)');
      break;
    }
    case 'custom': {
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        break;
      }

      formatter = (value: number) => formatCompactCurrency(value, 1);

      const perIncomeData = chartData.flatMap(({ age, perIncomeData }) =>
        perIncomeData.filter((income) => income.id === customDataID && income.income !== 0).map((income) => ({ age, ...income }))
      );
      if (perIncomeData.length > 0) {
        lineDataKeys.push('income');
        strokeColors.push('var(--chart-2)');

        chartData = perIncomeData;
        break;
      }

      const perExpenseData = chartData.flatMap(({ age, perExpenseData }) =>
        perExpenseData.filter((expense) => expense.id === customDataID && expense.expense !== 0).map((expense) => ({ age, ...expense }))
      );
      if (perExpenseData.length > 0) {
        lineDataKeys.push('expense');
        strokeColors.push('var(--chart-4)');

        chartData = perExpenseData;
        break;
      }

      const perAssetData = chartData.flatMap(({ age, perAssetData }) =>
        perAssetData.filter((asset) => asset.id === customDataID && asset.loanPayment !== 0).map((asset) => ({ age, ...asset }))
      );
      if (perAssetData.length > 0) {
        lineDataKeys.push('loanPayment');
        strokeColors.push('var(--chart-8)');

        chartData = perAssetData;
        break;
      }

      const perDebtData = chartData.flatMap(({ age, perDebtData }) =>
        perDebtData.filter((debt) => debt.id === customDataID && debt.payment !== 0).map((debt) => ({ age, ...debt }))
      );
      if (perDebtData.length > 0) {
        lineDataKeys.push('payment');
        strokeColors.push('var(--chart-5)');

        chartData = perDebtData;
        break;
      }

      break;
    }
    case 'savingsRate': {
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;

      lineDataKeys.push('savingsRate');
      strokeColors.push('var(--chart-3)');
      break;
    }
  }

  const interval = useChartInterval(chartData.length);

  const onClick = useCallback(
    (data: { activeLabel: string | number | undefined }) => {
      if (data.activeLabel !== undefined && onAgeSelect) {
        onAgeSelect(Number(data.activeLabel));
      }
    },
    [onAgeSelect]
  );

  const allDataKeys = [...lineDataKeys, ...barDataKeys];
  const hasNoData =
    chartData.length === 0 || chartData.every((point) => allDataKeys.every((key) => point[key as keyof typeof point] === 0));
  if (hasNoData) {
    return <ChartEmptyState />;
  }

  return (
    <TimeSeriesChartContainer ref={chartRef}>
      <ComposedChart
        responsive
        width="100%"
        height="100%"
        data={chartData}
        className="text-xs"
        stackOffset={stackOffset}
        margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
        tabIndex={-1}
        onClick={onClick}
      >
        <ChartGrid />
        <TimeSeriesXAxis interval={interval} />
        <TimeSeriesYAxis formatter={formatter} />
        {stackOffset === 'sign' && <SignReferenceLine />}
        <LineSeries dataKeys={lineDataKeys} strokeColors={strokeColors} />
        <BarSeries dataKeys={barDataKeys} barColors={barColors} stackId="barStack" />
        <Tooltip
          content={<CustomTooltip startAge={startAge} disabled={isSmallScreen && clickedOutsideChart} dataView={dataView} />}
          cursor={{ stroke: foregroundColor }}
        />
        <AgeReferenceLines keyMetrics={keyMetrics} showReferenceLines={showReferenceLines} selectedAge={selectedAge} />
      </ComposedChart>
    </TimeSeriesChartContainer>
  );
}
