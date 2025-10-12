import type { ExpenseData } from '@/lib/calc/v2/expenses';
import type { IncomeData } from '@/lib/calc/v2/incomes';
import type { AccountDataWithTransactions } from '@/lib/calc/v2/account';
import type { AccountDataWithReturns } from '@/lib/calc/v2/returns';

export interface SingleSimulationPortfolioChartDataPoint {
  age: number;
  stockHoldings: number;
  bondHoldings: number;
  cashHoldings: number;
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
  earnedIncome: number;
  incomeTax: number;
  capGainsTax: number;
  earlyWithdrawalPenalties: number;
  expenses: number;
  operatingCashFlow: number;
  savingsRate: number | null;
}

export interface SingleSimulationReturnsChartDataPoint {
  age: number;
  stocksRate: number;
  bondsRate: number;
  cashRate: number;
  inflationRate: number;
  cumulativeStocksAmount: number;
  cumulativeBondsAmount: number;
  cumulativeCashAmount: number;
  annualStocksAmount: number;
  annualBondsAmount: number;
  annualCashAmount: number;
  perAccountData: AccountDataWithReturns[];
}

export interface SingleSimulationTaxesChartDataPoint {
  age: number;

  /* Ordinary Income */
  earnedIncome: number;
  grossIncome: number;
  taxDeferredWithdrawals: number;
  earlyTaxFreeEarningsWithdrawals: number;
  taxableInterestIncome: number;
  taxableOrdinaryIncome: number;
  annualIncomeTax: number;
  cumulativeIncomeTax: number;
  effectiveIncomeTaxRate: number;
  topMarginalIncomeTaxRate: number;
  netIncome: number;

  /* Cap Gains */
  realizedGains: number;
  taxableDividendIncome: number;
  taxableCapGains: number;
  annualCapGainsTax: number;
  cumulativeCapGainsTax: number;
  effectiveCapGainsTaxRate: number;
  topMarginalCapGainsTaxRate: number;
  netCapGains: number;

  /* Early Withdrawal Penalties */
  annualEarlyWithdrawalPenalties: number;
  cumulativeEarlyWithdrawalPenalties: number;

  /* Totals */
  totalTaxableIncome: number;
  annualTotalTaxesAndPenalties: number;
  cumulativeTotalTaxesAndPenalties: number;
  totalNetIncome: number;

  /* Adjustments & Deductions */
  adjustments: Record<string, number>;
  deductions: Record<string, number>;
  capitalLossDeduction: number | undefined;
}

export interface SingleSimulationContributionsChartDataPoint {
  age: number;
  cumulativeContributions: number;
  annualContributions: number;
  perAccountData: AccountDataWithTransactions[];
  taxableBrokerage: number;
  taxDeferred: number;
  taxFree: number;
  cashSavings: number;
}

export interface SingleSimulationWithdrawalsChartDataPoint {
  age: number;
  cumulativeWithdrawals: number;
  cumulativeRealizedGains: number;
  cumulativeRequiredMinimumDistributions: number;
  cumulativeEarlyWithdrawals: number;
  cumulativeRothEarningsWithdrawals: number;
  cumulativeEarlyWithdrawalPenalties: number;
  annualWithdrawals: number;
  annualRealizedGains: number;
  annualRequiredMinimumDistributions: number;
  annualEarlyWithdrawals: number;
  annualRothEarningsWithdrawals: number;
  annualEarlyWithdrawalPenalties: number;
  perAccountData: AccountDataWithTransactions[];
  taxableBrokerage: number;
  taxDeferred: number;
  taxFree: number;
  cashSavings: number;
  withdrawalRate: number | null;
}
