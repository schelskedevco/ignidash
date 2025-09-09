import type { ExpenseData } from '@/lib/calc/v2/expenses';
import type { IncomeData } from '@/lib/calc/v2/incomes';

export interface StochasticCashFlowChartDataPoint {
  age: number;
  name: string;
  amount: number;
}

export interface StochasticReturnsChartDataPoint {
  age: number;
  name: string;
  rate: number | null;
  amount: number | null;
}

export interface StochasticWithdrawalsChartDataPoint {
  age: number;
  name: string;
  rate: number | null;
  amount: number | null;
}

export interface SingleSimulationCashFlowChartDataPoint {
  age: number;
  perIncomeData: IncomeData[];
  perExpenseData: ExpenseData[];
  totalNetIncome: number;
  totalGrossIncome: number;
  totalExpenses: number;
  totalNetCashFlow: number;
}
