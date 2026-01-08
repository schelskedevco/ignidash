import type { ExpenseData } from '@/lib/calc/expenses';
import type { IncomeData } from '@/lib/calc/incomes';
import type { AccountDataWithTransactions } from '@/lib/calc/account';
import type { AccountDataWithReturns } from '@/lib/calc/returns';
import type { IncomeTaxBracket } from '@/lib/calc/tax-data/income-tax-brackets';
import type { CapitalGainsTaxBracket } from '@/lib/calc/tax-data/capital-gains-tax-brackets';

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
  socialSecurityIncome: number;
  taxExemptIncome: number;
  employerMatch: number;
  income: number;
  incomeTax: number;
  ficaTax: number;
  capGainsTax: number;
  niit: number;
  earlyWithdrawalPenalties: number;
  taxesAndPenalties: number;
  expenses: number;
  netCashFlow: number;
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
  taxableIncome: number;

  /* Ordinary Income */
  earnedIncome: number;
  annualFicaTax: number;
  cumulativeFicaTax: number;
  taxDeferredWithdrawals: number;
  earlyRothEarningsWithdrawals: number;
  early401kAndIraWithdrawals: number;
  earlyHsaWithdrawals: number;
  retirementDistributions: number;
  interestIncome: number;
  taxableOrdinaryIncome: number;
  annualIncomeTax: number;
  cumulativeIncomeTax: number;
  effectiveIncomeTaxRate: number;
  topMarginalIncomeTaxRate: number;
  incomeTaxBrackets: IncomeTaxBracket[];

  /* Social Security */
  socialSecurityIncome: number;
  taxableSocialSecurityIncome: number;
  maxTaxablePercentage: number;
  actualTaxablePercentage: number;

  /* Cap Gains */
  realizedGains: number;
  dividendIncome: number;
  taxableCapGains: number;
  annualCapGainsTax: number;
  cumulativeCapGainsTax: number;
  effectiveCapGainsTaxRate: number;
  topMarginalCapGainsTaxRate: number;
  capitalGainsTaxBrackets: CapitalGainsTaxBracket[];

  /* NIIT */
  netInvestmentIncome: number;
  incomeSubjectToNiit: number;
  annualNiit: number;
  cumulativeNiit: number;

  /* Early Withdrawal Penalties */
  annualEarlyWithdrawalPenalties: number;
  cumulativeEarlyWithdrawalPenalties: number;

  /* Tax-Exempt Income */
  taxExemptIncome: number;

  /* Totals */
  annualTotalTaxesAndPenalties: number;
  cumulativeTotalTaxesAndPenalties: number;

  /* Adjustments & Deductions */
  adjustments: Record<string, number>;
  deductions: Record<string, number>;
  taxDeductibleContributions: number;
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
  annualShortfallRepaid: number;
  outstandingShortfall: number;
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
  annualShortfall: number;
  outstandingShortfall: number;
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
