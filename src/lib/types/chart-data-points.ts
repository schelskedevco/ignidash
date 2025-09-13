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
  taxable: number;
  taxDeferred: number;
  taxFree: number;
  savings: number;
}

export interface SingleSimulationCashFlowChartDataPoint {
  age: number;
  perIncomeData: IncomeData[];
  perExpenseData: ExpenseData[];
  netIncome: number;
  grossIncome: number;
  expenses: number;
  netCashFlow: number;
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
  taxableCapitalGains: number;
  capitalGainsTaxAmount: number;
  effectiveCapitalGainsTaxRate: number;
  topMarginalCapitalGainsTaxRate: number;
  netCapitalGains: number;
  totalTaxesDue: number;
  totalTaxesRefund: number;
  totalTaxableIncome: number;
}

export interface SingleSimulationContributionsChartDataPoint {
  age: number;
  totalContributions: number;
  contributionsForPeriod: number;
  perAccountData: AccountDataWithTransactions[];
  taxable: number;
  taxDeferred: number;
  taxFree: number;
  savings: number;
}

export interface SingleSimulationWithdrawalsChartDataPoint {
  age: number;
  totalWithdrawals: number;
  totalRealizedGains: number;
  withdrawalsForPeriod: number;
  realizedGainsForPeriod: number;
  perAccountData: AccountDataWithTransactions[];
  taxable: number;
  taxDeferred: number;
  taxFree: number;
  savings: number;
}
