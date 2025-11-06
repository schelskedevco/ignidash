import type { ExpenseData } from '@/lib/calc/expenses';
import type { IncomeData } from '@/lib/calc/incomes';
import type { AccountDataWithTransactions } from '@/lib/calc/account';
import type { AccountDataWithReturns } from '@/lib/calc/returns';

export interface SingleSimulationPortfolioChartDataPoint {
  age: number;
  stockHoldings: number;
  bondHoldings: number;
  cashHoldings: number;
  taxableValue: number;
  taxDeferredValue: number;
  taxFreeValue: number;
  cashSavings: number;
  perAccountData: AccountDataWithTransactions[];
}

export interface SingleSimulationCashFlowChartDataPoint {
  age: number;
  perIncomeData: IncomeData[];
  perExpenseData: ExpenseData[];
  earnedIncome: number;
  taxExemptIncome: number;
  incomeTax: number;
  ficaTax: number;
  capGainsTax: number;
  earlyWithdrawalPenalties: number;
  otherTaxes: number;
  totalTaxesAndPenalties: number;
  expenses: number;
  operatingCashFlow: number;
  savingsRate: number | null;
}

export interface SingleSimulationReturnsChartDataPoint {
  age: number;
  realStockReturn: number;
  realBondReturn: number;
  realCashReturn: number;
  inflationRate: number;
  cumulativeStockGrowth: number;
  cumulativeBondGrowth: number;
  cumulativeCashGrowth: number;
  annualStockGrowth: number;
  annualBondGrowth: number;
  annualCashGrowth: number;
  perAccountData: AccountDataWithReturns[];
}

export interface SingleSimulationTaxesChartDataPoint {
  age: number;
  grossIncome: number;
  adjustedGrossIncome: number;

  /* Ordinary Income */
  earnedIncome: number;
  taxExemptIncome: number;
  taxDeferredWithdrawals: number;
  earlyRothEarningsWithdrawals: number;
  retirementDistributions: number;
  interestIncome: number;
  grossOrdinaryIncome: number;
  taxableOrdinaryIncome: number;
  annualIncomeTax: number;
  cumulativeIncomeTax: number;
  annualFicaTax: number;
  cumulativeFicaTax: number;
  effectiveIncomeTaxRate: number;
  topMarginalIncomeTaxRate: number;

  /* Cap Gains */
  realizedGains: number;
  dividendIncome: number;
  grossCapGains: number;
  taxableCapGains: number;
  annualCapGainsTax: number;
  cumulativeCapGainsTax: number;
  effectiveCapGainsTaxRate: number;
  topMarginalCapGainsTaxRate: number;

  /* Early Withdrawal Penalties */
  annualEarlyWithdrawalPenalties: number;
  cumulativeEarlyWithdrawalPenalties: number;

  /* Totals */
  totalTaxableIncome: number;
  annualTotalTaxesAndPenalties: number;
  cumulativeTotalTaxesAndPenalties: number;

  /* Adjustments & Deductions */
  adjustments: Record<string, number>;
  deductions: Record<string, number>;
  taxDeferredContributions: number;
  standardDeduction: number;
  capitalLossDeduction: number;
}

export interface SingleSimulationContributionsChartDataPoint {
  age: number;
  cumulativeContributions: number;
  annualContributions: number;
  cumulativeEmployerMatch: number;
  annualEmployerMatch: number;
  perAccountData: AccountDataWithTransactions[];
  taxableContributions: number;
  taxDeferredContributions: number;
  taxFreeContributions: number;
  cashContributions: number;
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
  taxableWithdrawals: number;
  taxDeferredWithdrawals: number;
  taxFreeWithdrawals: number;
  cashWithdrawals: number;
  withdrawalRate: number | null;
}

export interface MultiSimulationChartData {
  portfolioData: MultiSimulationPortfolioChartDataPoint[];
  phasesData: MultiSimulationPhasesChartDataPoint[];
}

export interface MultiSimulationPortfolioChartDataPoint {
  age: number;
  meanPortfolioValue: number;
  minPortfolioValue: number;
  maxPortfolioValue: number;
  stdDevPortfolioValue: number;
  p10PortfolioValue: number;
  p25PortfolioValue: number;
  p50PortfolioValue: number;
  p75PortfolioValue: number;
  p90PortfolioValue: number;
}

export interface MultiSimulationPhasesChartDataPoint {
  age: number;
  percentAccumulation: number;
  numberAccumulation: number;
  percentRetirement: number;
  numberRetirement: number;
  percentBankrupt: number;
  numberBankrupt: number;
  chanceOfRetirement: number;
  chanceOfBankruptcy: number;
  meanYearsToRetirement: number;
  minYearsToRetirement: number;
  maxYearsToRetirement: number;
  meanRetirementAge: number;
  minRetirementAge: number;
  maxRetirementAge: number;
  meanYearsToBankruptcy: number;
  minYearsToBankruptcy: number;
  maxYearsToBankruptcy: number;
  meanBankruptcyAge: number;
  minBankruptcyAge: number;
  maxBankruptcyAge: number;
}
