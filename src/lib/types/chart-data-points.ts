import type { ExpenseData } from '@/lib/calc/v2/expenses';
import type { IncomeData } from '@/lib/calc/v2/incomes';
import type { AccountDataWithTransactions } from '@/lib/calc/v2/portfolio';

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

export interface SingleSimulationPortfolioChartDataPoint {
  age: number;
  stocks: number;
  bonds: number;
  cash: number;
  taxableBrokerage: number;
  taxDeferred: number;
  taxFree: number;
  cashSavings: number;
  perAccountData: AccountDataWithTransactions[];
}

export interface SingleSimulationCashFlowChartDataPoint {
  age: number;
  perIncomeData: IncomeData[];
  perExpenseData: ExpenseData[];
  ordinaryIncome: number;
  taxDeferredWithdrawals: number;
  grossIncome: number;
  incomeTax: number;
  expenses: number;
  netIncome: number;
  netCashFlow: number;
  savingsRate: number | null;
}

export interface SingleSimulationReturnsChartDataPoint {
  age: number;
  stocksRate: number;
  bondsRate: number;
  cashRate: number;
  inflationRate: number;
  totalStocksAmount: number;
  totalBondsAmount: number;
  totalCashAmount: number;
  stocksAmount: number;
  bondsAmount: number;
  cashAmount: number;
}

export interface SingleSimulationTaxesChartDataPoint {
  age: number;
  taxableOrdinaryIncome: number;
  incomeTaxAmount: number;
  effectiveIncomeTaxRate: number;
  topMarginalIncomeTaxRate: number;
  netIncome: number;
  capitalLossDeduction: number | undefined;
  taxableCapGains: number;
  capGainsTaxAmount: number;
  effectiveCapGainsTaxRate: number;
  topMarginalCapGainsTaxRate: number;
  netCapGains: number;
  totalTaxableIncome: number;
  totalTaxesAmount: number;
  totalNetIncome: number;
}

export interface SingleSimulationContributionsChartDataPoint {
  age: number;
  totalContributions: number;
  annualContributions: number;
  perAccountData: AccountDataWithTransactions[];
  taxableBrokerage: number;
  taxDeferred: number;
  taxFree: number;
  cashSavings: number;
}

export interface SingleSimulationWithdrawalsChartDataPoint {
  age: number;
  totalWithdrawals: number;
  totalRealizedGains: number;
  annualWithdrawals: number;
  annualRealizedGains: number;
  perAccountData: AccountDataWithTransactions[];
  taxableBrokerage: number;
  taxDeferred: number;
  taxFree: number;
  cashSavings: number;
}
