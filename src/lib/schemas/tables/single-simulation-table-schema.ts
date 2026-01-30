import { z } from 'zod';

import type { ColumnFormat } from '@/lib/types/column-format';

// ================================
// NET WORTH TABLE SCHEMA
// ================================

export const singleSimulationNetWorthTableRowSchema = z.object({
  year: z.number(),
  age: z.number(),
  phaseName: z.string().nullable(),
  totalPortfolioValue: z.number(),
  annualReturns: z.number().nullable(),
  annualWithdrawals: z.number().nullable(),
  annualContributions: z.number().nullable(),
  netPortfolioChange: z.number().nullable(),
  stockHoldings: z.number(),
  bondHoldings: z.number(),
  cashHoldings: z.number(),
  taxableValue: z.number().nullable(),
  taxDeferredValue: z.number().nullable(),
  taxFreeValue: z.number().nullable(),
  cashSavings: z.number().nullable(),
  historicalYear: z.number().nullable(),
});

export type SingleSimulationNetWorthTableRow = z.infer<typeof singleSimulationNetWorthTableRowSchema>;

const SINGLE_SIMULATION_COLUMNS = {
  year: { title: 'Year', format: 'number' },
  age: { title: 'Age', format: 'number' },
  phaseName: { title: 'Phase Name', format: 'string' },
  totalPortfolioValue: { title: 'Total Portfolio Value', format: 'currency' },
  annualReturns: { title: 'Annual Returns', format: 'currency' },
  annualContributions: { title: 'Annual Contributions', format: 'currency' },
  annualWithdrawals: { title: 'Annual Withdrawals', format: 'currency' },
  netPortfolioChange: { title: 'Net Portfolio Change', format: 'currency' },
  stockHoldings: { title: 'Stock Holdings', format: 'currency' },
  bondHoldings: { title: 'Bond Holdings', format: 'currency' },
  cashHoldings: { title: 'Cash Holdings', format: 'currency' },
  taxableValue: { title: 'Taxable Value', format: 'currency' },
  taxDeferredValue: { title: 'Tax-Deferred Value', format: 'currency' },
  taxFreeValue: { title: 'Tax-Free Value', format: 'currency' },
  cashSavings: { title: 'Cash Savings', format: 'currency' },
  historicalYear: { title: 'Historical Year', format: 'number' },
} as const;

export const SIMULATION_NET_WORTH_TABLE_CONFIG: Record<keyof SingleSimulationNetWorthTableRow, { title: string; format: ColumnFormat }> =
  SINGLE_SIMULATION_COLUMNS;

// ================================
// CASH FLOW TABLE SCHEMA
// ================================

export const singleSimulationCashFlowTableRowSchema = z.object({
  year: z.number(),
  age: z.number(),
  phaseName: z.string().nullable(),
  earnedIncome: z.number().nullable(),
  employerMatch: z.number().nullable(),
  socialSecurityIncome: z.number().nullable(),
  taxFreeIncome: z.number().nullable(),
  incomeTax: z.number().nullable(),
  ficaTax: z.number().nullable(),
  capGainsTax: z.number().nullable(),
  niit: z.number().nullable(),
  earlyWithdrawalPenalties: z.number().nullable(),
  totalTaxesAndPenalties: z.number().nullable(),
  expenses: z.number().nullable(),
  surplusDeficit: z.number().nullable(),
  amountInvested: z.number().nullable(),
  amountLiquidated: z.number().nullable(),
  netCashFlow: z.number().nullable(),
  savingsRate: z.number().nullable(),
  historicalYear: z.number().nullable(),
});

export type SingleSimulationCashFlowTableRow = z.infer<typeof singleSimulationCashFlowTableRowSchema>;

const SINGLE_SIMULATION_CASH_FLOW_COLUMNS = {
  year: { title: 'Year', format: 'number' },
  age: { title: 'Age', format: 'number' },
  phaseName: { title: 'Phase Name', format: 'string' },
  earnedIncome: { title: 'Earned Income', format: 'currency' },
  employerMatch: { title: 'Employer Match', format: 'currency' },
  socialSecurityIncome: { title: 'Social Security Income', format: 'currency' },
  taxFreeIncome: { title: 'Tax-Free Income', format: 'currency' },
  incomeTax: { title: 'Income Tax', format: 'currency' },
  ficaTax: { title: 'FICA Tax', format: 'currency' },
  capGainsTax: { title: 'Capital Gains Tax', format: 'currency' },
  niit: { title: 'NIIT', format: 'currency' },
  earlyWithdrawalPenalties: { title: 'Early Withdrawal Penalties', format: 'currency' },
  totalTaxesAndPenalties: { title: 'Total Taxes & Penalties', format: 'currency' },
  expenses: { title: 'Expenses', format: 'currency' },
  surplusDeficit: { title: 'Surplus/Deficit', format: 'currency' },
  amountInvested: { title: 'Amount Invested', format: 'currency' },
  amountLiquidated: { title: 'Amount Liquidated', format: 'currency' },
  netCashFlow: { title: 'Net Cash Flow', format: 'currency' },
  savingsRate: { title: 'Savings Rate', format: 'percentage' },
  historicalYear: { title: 'Historical Year', format: 'number' },
} as const;

export const SIMULATION_CASH_FLOW_TABLE_CONFIG: Record<keyof SingleSimulationCashFlowTableRow, { title: string; format: ColumnFormat }> =
  SINGLE_SIMULATION_CASH_FLOW_COLUMNS;

// ================================
// TAXES TABLE SCHEMA
// ================================

export const singleSimulationTaxesTableRowSchema = z.object({
  year: z.number(),
  age: z.number(),
  phaseName: z.string().nullable(),
  grossIncome: z.number().nullable(),
  adjustedGrossIncome: z.number().nullable(),
  taxableIncome: z.number().nullable(),

  // Ordinary Income
  earnedIncome: z.number().nullable(),
  annualFicaTax: z.number().nullable(),
  cumulativeFicaTax: z.number().nullable(),
  taxableRetirementDistributions: z.number().nullable(),
  taxableInterestIncome: z.number().nullable(),
  annualIncomeTax: z.number().nullable(),
  cumulativeIncomeTax: z.number().nullable(),
  effectiveIncomeTaxRate: z.number().nullable(),
  topMarginalIncomeTaxRate: z.number().nullable(),

  // Social Security
  socialSecurityIncome: z.number().nullable(),
  taxableSocialSecurityIncome: z.number().nullable(),
  provisionalIncome: z.number().nullable(),
  maxTaxableSocialSecurityPercentage: z.number().nullable(),
  actualTaxableSocialSecurityPercentage: z.number().nullable(),

  // Cap Gains
  realizedGains: z.number().nullable(),
  taxableDividendIncome: z.number().nullable(),
  annualCapGainsTax: z.number().nullable(),
  cumulativeCapGainsTax: z.number().nullable(),
  effectiveCapGainsTaxRate: z.number().nullable(),
  topMarginalCapGainsTaxRate: z.number().nullable(),

  // NIIT
  netInvestmentIncome: z.number().nullable(),
  incomeSubjectToNiit: z.number().nullable(),
  annualNiit: z.number().nullable(),
  cumulativeNiit: z.number().nullable(),

  // Early Withdrawal Penalties
  annualEarlyWithdrawalPenalties: z.number().nullable(),
  cumulativeEarlyWithdrawalPenalties: z.number().nullable(),

  // Totals
  annualTotalTaxesAndPenalties: z.number().nullable(),
  cumulativeTotalTaxesAndPenalties: z.number().nullable(),

  // Tax-Free Income
  taxFreeIncome: z.number().nullable(),

  // Adjustments & Deductions
  taxDeductibleContributions: z.number().nullable(),
  standardDeduction: z.number().nullable(),
  capitalLossDeduction: z.number().nullable(),
  historicalYear: z.number().nullable(),
});

export type SingleSimulationTaxesTableRow = z.infer<typeof singleSimulationTaxesTableRowSchema>;

const SINGLE_SIMULATION_TAXES_COLUMNS = {
  year: { title: 'Year', format: 'number' },
  age: { title: 'Age', format: 'number' },
  phaseName: { title: 'Phase Name', format: 'string' },
  grossIncome: { title: 'Gross Income', format: 'currency' },
  adjustedGrossIncome: { title: 'Adjusted Gross Income', format: 'currency' },
  taxableIncome: { title: 'Taxable Income', format: 'currency' },
  earnedIncome: { title: 'Earned Income', format: 'currency' },
  annualFicaTax: { title: 'Annual FICA Tax', format: 'currency' },
  cumulativeFicaTax: { title: 'Cumulative FICA Tax', format: 'currency' },
  taxableRetirementDistributions: { title: 'Taxable Retirement Distributions', format: 'currency' },
  taxableInterestIncome: { title: 'Taxable Interest Income', format: 'currency' },
  annualIncomeTax: { title: 'Annual Income Tax', format: 'currency' },
  cumulativeIncomeTax: { title: 'Cumulative Income Tax', format: 'currency' },
  effectiveIncomeTaxRate: { title: 'Effective Income Tax Rate', format: 'percentage' },
  topMarginalIncomeTaxRate: { title: 'Top Marginal Income Tax Rate', format: 'percentage' },
  socialSecurityIncome: { title: 'Social Security Income', format: 'currency' },
  taxableSocialSecurityIncome: { title: 'Taxable Social Security Income', format: 'currency' },
  provisionalIncome: { title: 'Provisional Income', format: 'currency' },
  maxTaxableSocialSecurityPercentage: { title: 'Max Taxable Social Security %', format: 'percentage' },
  actualTaxableSocialSecurityPercentage: { title: 'Actual Taxable Social Security %', format: 'percentage' },
  realizedGains: { title: 'Realized Capital Gains', format: 'currency' },
  taxableDividendIncome: { title: 'Taxable Dividend Income', format: 'currency' },
  annualCapGainsTax: { title: 'Annual Capital Gains Tax', format: 'currency' },
  cumulativeCapGainsTax: { title: 'Cumulative Capital Gains Tax', format: 'currency' },
  effectiveCapGainsTaxRate: { title: 'Effective Capital Gains Tax Rate', format: 'percentage' },
  topMarginalCapGainsTaxRate: { title: 'Top Marginal Capital Gains Tax Rate', format: 'percentage' },
  netInvestmentIncome: { title: 'Net Investment Income', format: 'currency' },
  incomeSubjectToNiit: { title: 'Income Subject to NIIT', format: 'currency' },
  annualNiit: { title: 'Annual NIIT', format: 'currency' },
  cumulativeNiit: { title: 'Cumulative NIIT', format: 'currency' },
  annualEarlyWithdrawalPenalties: { title: 'Annual Early Withdrawal Penalties', format: 'currency' },
  cumulativeEarlyWithdrawalPenalties: { title: 'Cumulative Early Withdrawal Penalties', format: 'currency' },
  annualTotalTaxesAndPenalties: { title: 'Annual Total Taxes & Penalties', format: 'currency' },
  cumulativeTotalTaxesAndPenalties: { title: 'Cumulative Total Taxes & Penalties', format: 'currency' },
  taxFreeIncome: { title: 'Tax-Free Income', format: 'currency' },
  taxDeductibleContributions: { title: 'Tax-Deductible Contributions', format: 'currency' },
  standardDeduction: { title: 'Standard Deduction', format: 'currency' },
  capitalLossDeduction: { title: 'Capital Loss Deduction', format: 'currency' },
  historicalYear: { title: 'Historical Year', format: 'number' },
} as const;

export const SIMULATION_TAXES_TABLE_CONFIG: Record<keyof SingleSimulationTaxesTableRow, { title: string; format: ColumnFormat }> =
  SINGLE_SIMULATION_TAXES_COLUMNS;

// ================================
// RETURNS TABLE SCHEMA
// ================================

export const singleSimulationReturnsTableRowSchema = z.object({
  year: z.number(),
  age: z.number(),
  phaseName: z.string().nullable(),
  totalAnnualGains: z.number().nullable(),
  totalCumulativeGains: z.number().nullable(),
  taxableGains: z.number().nullable(),
  taxDeferredGains: z.number().nullable(),
  taxFreeGains: z.number().nullable(),
  cashSavingsGains: z.number().nullable(),
  stockReturnRate: z.number().nullable(),
  stockHoldings: z.number().nullable(),
  annualStockGain: z.number().nullable(),
  cumulativeStockGain: z.number().nullable(),
  bondReturnRate: z.number().nullable(),
  bondHoldings: z.number().nullable(),
  annualBondGain: z.number().nullable(),
  cumulativeBondGain: z.number().nullable(),
  cashReturnRate: z.number().nullable(),
  cashHoldings: z.number().nullable(),
  annualCashGain: z.number().nullable(),
  cumulativeCashGain: z.number().nullable(),
  inflationRate: z.number().nullable(),
  historicalYear: z.number().nullable(),
});

export type SingleSimulationReturnsTableRow = z.infer<typeof singleSimulationReturnsTableRowSchema>;

const SINGLE_SIMULATION_RETURNS_COLUMNS = {
  year: { title: 'Year', format: 'number' },
  age: { title: 'Age', format: 'number' },
  phaseName: { title: 'Phase Name', format: 'string' },
  totalAnnualGains: { title: 'Total Annual Gains', format: 'currency' },
  totalCumulativeGains: { title: 'Total Cumulative Gains', format: 'currency' },
  taxableGains: { title: 'Taxable Gains', format: 'currency' },
  taxDeferredGains: { title: 'Tax-Deferred Gains', format: 'currency' },
  taxFreeGains: { title: 'Tax-Free Gains', format: 'currency' },
  cashSavingsGains: { title: 'Cash Savings Gains', format: 'currency' },
  stockReturnRate: { title: 'Real Stock Return Rate', format: 'percentage' },
  stockHoldings: { title: 'Stock Holdings', format: 'currency' },
  annualStockGain: { title: 'Annual Stock Gain', format: 'currency' },
  cumulativeStockGain: { title: 'Cumulative Stock Gain', format: 'currency' },
  bondReturnRate: { title: 'Real Bond Return Rate', format: 'percentage' },
  bondHoldings: { title: 'Bond Holdings', format: 'currency' },
  annualBondGain: { title: 'Annual Bond Gain', format: 'currency' },
  cumulativeBondGain: { title: 'Cumulative Bond Gain', format: 'currency' },
  cashReturnRate: { title: 'Real Cash Return Rate', format: 'percentage' },
  cashHoldings: { title: 'Cash Holdings', format: 'currency' },
  annualCashGain: { title: 'Annual Cash Gain', format: 'currency' },
  cumulativeCashGain: { title: 'Cumulative Cash Gain', format: 'currency' },
  inflationRate: { title: 'Inflation Rate', format: 'percentage' },
  historicalYear: { title: 'Historical Year', format: 'number' },
} as const;

export const SIMULATION_RETURNS_TABLE_CONFIG: Record<keyof SingleSimulationReturnsTableRow, { title: string; format: ColumnFormat }> =
  SINGLE_SIMULATION_RETURNS_COLUMNS;

// ================================
// CONTRIBUTIONS TABLE SCHEMA
// ================================

export const singleSimulationContributionsTableRowSchema = z.object({
  year: z.number(),
  age: z.number(),
  phaseName: z.string().nullable(),
  annualContributions: z.number().nullable(),
  cumulativeContributions: z.number().nullable(),
  stockContributions: z.number().nullable(),
  bondContributions: z.number().nullable(),
  cashContributions: z.number().nullable(),
  taxableContributions: z.number().nullable(),
  taxDeferredContributions: z.number().nullable(),
  taxFreeContributions: z.number().nullable(),
  cashSavingsContributions: z.number().nullable(),
  annualEmployerMatch: z.number().nullable(),
  cumulativeEmployerMatch: z.number().nullable(),
  totalPortfolioValue: z.number().nullable(),
  surplusDeficit: z.number().nullable(),
  savingsRate: z.number().nullable(),
  annualShortfallRepaid: z.number().nullable(),
  outstandingShortfall: z.number().nullable(),
  historicalYear: z.number().nullable(),
});

export type SingleSimulationContributionsTableRow = z.infer<typeof singleSimulationContributionsTableRowSchema>;

const SINGLE_SIMULATION_CONTRIBUTIONS_COLUMNS = {
  year: { title: 'Year', format: 'number' },
  age: { title: 'Age', format: 'number' },
  phaseName: { title: 'Phase Name', format: 'string' },
  annualContributions: { title: 'Total Annual Contributions', format: 'currency' },
  cumulativeContributions: { title: 'Total Cumulative Contributions', format: 'currency' },
  stockContributions: { title: 'Stock Contributions', format: 'currency' },
  bondContributions: { title: 'Bond Contributions', format: 'currency' },
  cashContributions: { title: 'Cash Contributions', format: 'currency' },
  taxableContributions: { title: 'Taxable Contributions', format: 'currency' },
  taxDeferredContributions: { title: 'Tax-Deferred Contributions', format: 'currency' },
  taxFreeContributions: { title: 'Tax-Free Contributions', format: 'currency' },
  cashSavingsContributions: { title: 'Cash Savings Contributions', format: 'currency' },
  annualEmployerMatch: { title: 'Annual Employer Match', format: 'currency' },
  cumulativeEmployerMatch: { title: 'Cumulative Employer Match', format: 'currency' },
  totalPortfolioValue: { title: 'Total Portfolio Value', format: 'currency' },
  surplusDeficit: { title: 'Surplus/Deficit', format: 'currency' },
  savingsRate: { title: 'Savings Rate', format: 'percentage' },
  annualShortfallRepaid: { title: 'Annual Shortfall Repaid', format: 'currency' },
  outstandingShortfall: { title: 'Outstanding Shortfall', format: 'currency' },
  historicalYear: { title: 'Historical Year', format: 'number' },
} as const;

export const SIMULATION_CONTRIBUTIONS_TABLE_CONFIG: Record<
  keyof SingleSimulationContributionsTableRow,
  { title: string; format: ColumnFormat }
> = SINGLE_SIMULATION_CONTRIBUTIONS_COLUMNS;

// ================================
// WITHDRAWALS TABLE SCHEMA
// ================================

export const singleSimulationWithdrawalsTableRowSchema = z.object({
  year: z.number(),
  age: z.number(),
  phaseName: z.string().nullable(),
  annualWithdrawals: z.number().nullable(),
  cumulativeWithdrawals: z.number().nullable(),
  stockWithdrawals: z.number().nullable(),
  bondWithdrawals: z.number().nullable(),
  cashWithdrawals: z.number().nullable(),
  taxableWithdrawals: z.number().nullable(),
  taxDeferredWithdrawals: z.number().nullable(),
  taxFreeWithdrawals: z.number().nullable(),
  cashSavingsWithdrawals: z.number().nullable(),
  annualRealizedGains: z.number().nullable(),
  cumulativeRealizedGains: z.number().nullable(),
  annualRequiredMinimumDistributions: z.number().nullable(),
  cumulativeRequiredMinimumDistributions: z.number().nullable(),
  annualEarlyWithdrawals: z.number().nullable(),
  cumulativeEarlyWithdrawals: z.number().nullable(),
  annualRothEarningsWithdrawals: z.number().nullable(),
  cumulativeRothEarningsWithdrawals: z.number().nullable(),
  totalPortfolioValue: z.number().nullable(),
  surplusDeficit: z.number().nullable(),
  withdrawalRate: z.number().nullable(),
  annualShortfall: z.number().nullable(),
  outstandingShortfall: z.number().nullable(),
  historicalYear: z.number().nullable(),
});

export type SingleSimulationWithdrawalsTableRow = z.infer<typeof singleSimulationWithdrawalsTableRowSchema>;

const SINGLE_SIMULATION_WITHDRAWALS_COLUMNS = {
  year: { title: 'Year', format: 'number' },
  age: { title: 'Age', format: 'number' },
  phaseName: { title: 'Phase Name', format: 'string' },
  annualWithdrawals: { title: 'Total Annual Withdrawals', format: 'currency' },
  cumulativeWithdrawals: { title: 'Total Cumulative Withdrawals', format: 'currency' },
  stockWithdrawals: { title: 'Stock Withdrawals', format: 'currency' },
  bondWithdrawals: { title: 'Bond Withdrawals', format: 'currency' },
  cashWithdrawals: { title: 'Cash Withdrawals', format: 'currency' },
  taxableWithdrawals: { title: 'Taxable Withdrawals', format: 'currency' },
  taxDeferredWithdrawals: { title: 'Tax-Deferred Withdrawals', format: 'currency' },
  taxFreeWithdrawals: { title: 'Tax-Free Withdrawals', format: 'currency' },
  cashSavingsWithdrawals: { title: 'Cash Savings Withdrawals', format: 'currency' },
  annualRealizedGains: { title: 'Annual Realized Gains', format: 'currency' },
  cumulativeRealizedGains: { title: 'Cumulative Realized Gains', format: 'currency' },
  annualRequiredMinimumDistributions: { title: 'Annual RMDs', format: 'currency' },
  cumulativeRequiredMinimumDistributions: { title: 'Cumulative RMDs', format: 'currency' },
  annualEarlyWithdrawals: { title: 'Annual Early Withdrawals', format: 'currency' },
  cumulativeEarlyWithdrawals: { title: 'Cumulative Early Withdrawals', format: 'currency' },
  annualRothEarningsWithdrawals: { title: 'Annual Roth Earnings Withdrawals', format: 'currency' },
  cumulativeRothEarningsWithdrawals: { title: 'Cumulative Roth Earnings Withdrawals', format: 'currency' },
  totalPortfolioValue: { title: 'Total Portfolio Value', format: 'currency' },
  surplusDeficit: { title: 'Surplus/Deficit', format: 'currency' },
  withdrawalRate: { title: 'Withdrawal Rate', format: 'percentage' },
  annualShortfall: { title: 'Annual Shortfall', format: 'currency' },
  outstandingShortfall: { title: 'Outstanding Shortfall', format: 'currency' },
  historicalYear: { title: 'Historical Year', format: 'number' },
} as const;

export const SIMULATION_WITHDRAWALS_TABLE_CONFIG: Record<
  keyof SingleSimulationWithdrawalsTableRow,
  { title: string; format: ColumnFormat }
> = SINGLE_SIMULATION_WITHDRAWALS_COLUMNS;
