'use client';

import Card from '@/components/ui/card';
import type { SingleSimulationIncomeExpensesChartDataPoint } from '@/lib/types/chart-data-points';
import { Subheading } from '@/components/catalyst/heading';
import { useIncomeData, useExpenseData } from '@/hooks/use-convex-data';

import SingleSimulationIncomeExpensesBarChart from '../../charts/single-simulation/single-simulation-income-expenses-bar-chart';

interface SingleSimulationIncomeExpensesBarChartCardProps {
  selectedAge: number;
  rawChartData: SingleSimulationIncomeExpensesChartDataPoint[];
  dataView: 'surplusDeficit' | 'cashFlow' | 'incomes' | 'expenses' | 'custom' | 'savingsRate';
  customDataID: string;
}

export default function SingleSimulationIncomeExpensesBarChartCard({
  selectedAge,
  rawChartData,
  dataView,
  customDataID,
}: SingleSimulationIncomeExpensesBarChartCardProps) {
  const incomeData = useIncomeData(customDataID !== '' ? customDataID : null);
  const expenseData = useExpenseData(customDataID !== '' ? customDataID : null);

  let title;
  switch (dataView) {
    case 'surplusDeficit':
      title = 'Surplus/Deficit';
      break;
    case 'cashFlow':
      title = 'Cash Flow';
      break;
    case 'incomes':
      title = 'Income Sources';
      break;
    case 'expenses':
      title = 'Expenses & Taxes';
      break;
    case 'custom':
      if (incomeData) {
        title = `${incomeData.name} — Income`;
      } else if (expenseData) {
        title = `${expenseData.name} — Expense`;
      } else {
        title = 'Custom';
      }
      break;
    case 'savingsRate':
      title = 'Savings Rate';
      break;
  }

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <Subheading level={3}>
          <span className="mr-2">{title}</span>
          <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
        </Subheading>
      </div>
      <SingleSimulationIncomeExpensesBarChart
        age={selectedAge}
        rawChartData={rawChartData}
        dataView={dataView}
        customDataID={customDataID}
      />
    </Card>
  );
}
