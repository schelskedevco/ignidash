import type { ExpenseData } from '@/lib/calc/expenses';
import type { IncomeData } from '@/lib/calc/incomes';
import type { AccountDataWithTransactions } from '@/lib/calc/account';
import type { AccountDataWithReturns } from '@/lib/calc/returns';
import type { IncomeTaxBracket } from '@/lib/calc/tax-data/income-tax-brackets';
import type { CapitalGainsTaxBracket } from '@/lib/calc/tax-data/capital-gains-tax-brackets';
import type { PhysicalAssetData } from '@/lib/calc/physical-assets';
import type { DebtData } from '@/lib/calc/debts';

export interface SingleSimulationNetWorthChartDataPoint {
  age: number;
  stockHoldings: number;
  bondHoldings: number;
  cashHoldings: number;
  taxableValue: number;
  taxDeferredValue: number;
  taxFreeValue: number;
  cashSavings: number;
  portfolioValue: number;
  annualReturns: number;
  annualContributions: number;
  annualWithdrawals: number;
  netPortfolioChange: number;
  assetValue: number;
  assetAppreciation: number;
  equity: number;
  debtBalance: number;
  netWorth: number;
  debtPaydown: number;
  netWorthChange: number;
  perAccountData: AccountDataWithTransactions[];
  perAssetData: PhysicalAssetData[];
  perDebtData: DebtData[];
}

export interface SingleSimulationCashFlowChartDataPoint {
  age: number;
  perIncomeData: IncomeData[];
  perExpenseData: ExpenseData[];
  perAssetData: PhysicalAssetData[];
  perDebtData: DebtData[];
  earnedIncome: number;
  employerMatch: number;
  socialSecurityIncome: number;
  taxFreeIncome: number;
  income: number;
  incomeTax: number;
  ficaTax: number;
  capGainsTax: number;
  niit: number;
  earlyWithdrawalPenalties: number;
  taxesAndPenalties: number;
  expenses: number;
  debtPayments: number;
  surplusDeficit: number;
  savingsRate: number | null;
  amountInvested: number;
  amountLiquidated: number;
  assetsPurchased: number;
  assetsSold: number;
  netCashFlow: number;
}

export interface SingleSimulationReturnsChartDataPoint {
  age: number;
  realStockReturnRate: number;
  realBondReturnRate: number;
  realCashReturnRate: number;
  inflationRate: number;
  cumulativeStockGain: number;
  cumulativeBondGain: number;
  cumulativeCashGain: number;
  totalCumulativeGains: number;
  annualStockGain: number;
  annualBondGain: number;
  annualCashGain: number;
  totalAnnualGains: number;
  taxableGains: number;
  taxDeferredGains: number;
  taxFreeGains: number;
  cashSavingsGains: number;
  annualAssetAppreciation: number;
  cumulativeAssetAppreciation: number;
  perAccountData: AccountDataWithReturns[];
  perAssetData: PhysicalAssetData[];
}

export interface SingleSimulationTaxesChartDataPoint {
  age: number;
  grossIncome: number;
  adjustedGrossIncome: number;
  taxableIncome: number;

  // Ordinary Income
  earnedIncome: number;
  annualFicaTax: number;
  cumulativeFicaTax: number;
  taxDeferredWithdrawals: number;
  earlyRothEarningsWithdrawals: number;
  early401kAndIraWithdrawals: number;
  earlyHsaWithdrawals: number;
  taxableRetirementDistributions: number;
  taxableInterestIncome: number;
  taxableIncomeTaxedAsOrdinary: number;
  adjustedIncomeTaxedAsOrdinary: number;
  incomeTaxedAsOrdinary: number;
  annualIncomeTax: number;
  cumulativeIncomeTax: number;
  effectiveIncomeTaxRate: number;
  topMarginalIncomeTaxRate: number;
  incomeTaxBrackets: IncomeTaxBracket[];

  // Social Security
  socialSecurityIncome: number;
  taxableSocialSecurityIncome: number;
  maxTaxablePercentage: number;
  actualTaxablePercentage: number;

  // Cap Gains
  realizedGains: number;
  taxableDividendIncome: number;
  taxableIncomeTaxedAsCapGains: number;
  adjustedIncomeTaxedAsCapGains: number;
  incomeTaxedAsLtcg: number;
  annualCapGainsTax: number;
  cumulativeCapGainsTax: number;
  effectiveCapGainsTaxRate: number;
  topMarginalCapGainsTaxRate: number;
  capitalGainsTaxBrackets: CapitalGainsTaxBracket[];

  // NIIT
  netInvestmentIncome: number;
  incomeSubjectToNiit: number;
  annualNiit: number;
  cumulativeNiit: number;
  niitThreshold: number;

  // Early Withdrawal Penalties
  annualEarlyWithdrawalPenalties: number;
  cumulativeEarlyWithdrawalPenalties: number;

  // Totals
  annualTotalTaxesAndPenalties: number;
  cumulativeTotalTaxesAndPenalties: number;

  // Tax-Free Income
  taxFreeIncome: number;

  // Adjustments & Deductions
  adjustments: Record<string, number>;
  deductions: Record<string, number>;
  taxDeductibleContributions: number;
  standardDeduction: number;
  capitalLossDeduction: number;
}

export interface SingleSimulationContributionsChartDataPoint {
  age: number;
  annualContributions: number;
  cumulativeContributions: number;
  annualStockContributions: number;
  cumulativeStockContributions: number;
  annualBondContributions: number;
  cumulativeBondContributions: number;
  annualCashContributions: number;
  cumulativeCashContributions: number;
  annualEmployerMatch: number;
  cumulativeEmployerMatch: number;
  perAccountData: AccountDataWithTransactions[];
  taxableContributions: number;
  taxDeferredContributions: number;
  taxFreeContributions: number;
  cashSavingsContributions: number;
  annualShortfallRepaid: number;
  outstandingShortfall: number;
}

export interface SingleSimulationWithdrawalsChartDataPoint {
  age: number;
  rmdAge: number;
  annualWithdrawals: number;
  cumulativeWithdrawals: number;
  annualStockWithdrawals: number;
  cumulativeStockWithdrawals: number;
  annualBondWithdrawals: number;
  cumulativeBondWithdrawals: number;
  annualCashWithdrawals: number;
  cumulativeCashWithdrawals: number;
  annualRealizedGains: number;
  cumulativeRealizedGains: number;
  annualRequiredMinimumDistributions: number;
  cumulativeRequiredMinimumDistributions: number;
  annualEarlyWithdrawals: number;
  cumulativeEarlyWithdrawals: number;
  annualRothEarningsWithdrawals: number;
  cumulativeRothEarningsWithdrawals: number;
  perAccountData: AccountDataWithTransactions[];
  taxableWithdrawals: number;
  taxDeferredWithdrawals: number;
  taxFreeWithdrawals: number;
  cashSavingsWithdrawals: number;
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
