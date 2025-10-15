import { z } from 'zod';

import type { ColumnFormat } from '@/lib/types/column-format';

// ================================
// PORTFOLIO TABLE SCHEMA
// ================================

export const singleSimulationPortfolioTableRowSchema = z.object({
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
  taxableBrokerageValue: z.number().nullable(),
  taxDeferredValue: z.number().nullable(),
  taxFreeValue: z.number().nullable(),
  cashSavings: z.number().nullable(),
  historicalYear: z.number().nullable(),
});

export type SingleSimulationPortfolioTableRow = z.infer<typeof singleSimulationPortfolioTableRowSchema>;

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
  taxableBrokerageValue: { title: 'Taxable Brokerage Value', format: 'currency' },
  taxDeferredValue: { title: 'Tax-Deferred Value', format: 'currency' },
  taxFreeValue: { title: 'Tax-Free Value', format: 'currency' },
  cashSavings: { title: 'Cash Savings', format: 'currency' },
  historicalYear: { title: 'Historical Year', format: 'number' },
} as const;

export const SIMULATION_PORTFOLIO_TABLE_CONFIG: Record<keyof SingleSimulationPortfolioTableRow, { title: string; format: ColumnFormat }> =
  SINGLE_SIMULATION_COLUMNS;

// ================================
// CASH FLOW TABLE SCHEMA
// ================================

export const singleSimulationCashFlowTableRowSchema = z.object({
  year: z.number(),
  age: z.number(),
  phaseName: z.string().nullable(),
  earnedIncome: z.number().nullable(),
  earnedIncomeAfterTax: z.number().nullable(),
  incomeTax: z.number().nullable(),
  capGainsTax: z.number().nullable(),
  earlyWithdrawalPenalties: z.number().nullable(),
  totalTaxesAndPenalties: z.number().nullable(),
  expenses: z.number().nullable(),
  operatingCashFlow: z.number().nullable(),
  savingsRate: z.number().nullable(),
  historicalYear: z.number().nullable(),
});

export type SingleSimulationCashFlowTableRow = z.infer<typeof singleSimulationCashFlowTableRowSchema>;

const SINGLE_SIMULATION_CASHFLOW_COLUMNS = {
  year: { title: 'Year', format: 'number' },
  age: { title: 'Age', format: 'number' },
  phaseName: { title: 'Phase Name', format: 'string' },
  earnedIncome: { title: 'Earned Income', format: 'currency' },
  earnedIncomeAfterTax: { title: 'Earned Income After Tax', format: 'currency' },
  incomeTax: { title: 'Income Tax', format: 'currency' },
  capGainsTax: { title: 'Capital Gains Tax', format: 'currency' },
  earlyWithdrawalPenalties: { title: 'Early Withdrawal Penalties', format: 'currency' },
  totalTaxesAndPenalties: { title: 'Total Taxes & Penalties', format: 'currency' },
  expenses: { title: 'Expenses', format: 'currency' },
  operatingCashFlow: { title: 'Operating Cash Flow', format: 'currency' },
  savingsRate: { title: 'Savings Rate', format: 'percentage' },
  historicalYear: { title: 'Historical Year', format: 'number' },
} as const;

export const SIMULATION_CASHFLOW_TABLE_CONFIG: Record<keyof SingleSimulationCashFlowTableRow, { title: string; format: ColumnFormat }> =
  SINGLE_SIMULATION_CASHFLOW_COLUMNS;

// ================================
// RETURNS TABLE SCHEMA
// ================================

export const singleSimulationReturnsTableRowSchema = z.object({
  year: z.number(),
  age: z.number(),
  phaseName: z.string().nullable(),
  stockRate: z.number().nullable(),
  stockHoldings: z.number().nullable(),
  annualStockAmount: z.number().nullable(),
  cumulativeStockAmount: z.number().nullable(),
  bondRate: z.number().nullable(),
  bondHoldings: z.number().nullable(),
  annualBondAmount: z.number().nullable(),
  cumulativeBondAmount: z.number().nullable(),
  cashRate: z.number().nullable(),
  cashHoldings: z.number().nullable(),
  annualCashAmount: z.number().nullable(),
  cumulativeCashAmount: z.number().nullable(),
  inflationRate: z.number().nullable(),
  historicalYear: z.number().nullable(),
});

export type SingleSimulationReturnsTableRow = z.infer<typeof singleSimulationReturnsTableRowSchema>;

const SINGLE_SIMULATION_RETURNS_COLUMNS = {
  year: { title: 'Year', format: 'number' },
  age: { title: 'Age', format: 'number' },
  phaseName: { title: 'Phase Name', format: 'string' },
  stockRate: { title: 'Real Stock Return', format: 'percentage' },
  stockHoldings: { title: 'Stock Holdings', format: 'currency' },
  annualStockAmount: { title: 'Annual Stock Growth', format: 'currency' },
  cumulativeStockAmount: { title: 'Cumulative Stock Growth', format: 'currency' },
  bondRate: { title: 'Real Bond Return', format: 'percentage' },
  bondHoldings: { title: 'Bond Holdings', format: 'currency' },
  annualBondAmount: { title: 'Annual Bond Growth', format: 'currency' },
  cumulativeBondAmount: { title: 'Cumulative Bond Growth', format: 'currency' },
  cashRate: { title: 'Real Cash Return', format: 'percentage' },
  cashHoldings: { title: 'Cash Holdings', format: 'currency' },
  annualCashAmount: { title: 'Annual Cash Growth', format: 'currency' },
  cumulativeCashAmount: { title: 'Cumulative Cash Growth', format: 'currency' },
  inflationRate: { title: 'Inflation Rate', format: 'percentage' },
  historicalYear: { title: 'Historical Year', format: 'number' },
} as const;

export const SIMULATION_RETURNS_TABLE_CONFIG: Record<keyof SingleSimulationReturnsTableRow, { title: string; format: ColumnFormat }> =
  SINGLE_SIMULATION_RETURNS_COLUMNS;

// ================================
// TAXES TABLE SCHEMA
// ================================

export const singleSimulationTaxesTableRowSchema = z.object({
  year: z.number(),
  age: z.number(),
  phaseName: z.string().nullable(),
  grossIncome: z.number().nullable(),
  adjustedGrossIncome: z.number().nullable(),
  totalTaxableIncome: z.number().nullable(),

  /* Ordinary Income */
  earnedIncome: z.number().nullable(),
  taxDeferredWithdrawals: z.number().nullable(),
  earlyRothEarningsWithdrawals: z.number().nullable(),
  totalRetirementDistributions: z.number().nullable(),
  interestIncome: z.number().nullable(),
  grossOrdinaryIncome: z.number().nullable(),
  taxableOrdinaryIncome: z.number().nullable(),
  annualIncomeTax: z.number().nullable(),
  cumulativeIncomeTax: z.number().nullable(),
  effectiveIncomeTaxRate: z.number().nullable(),
  topMarginalIncomeTaxRate: z.number().nullable(),

  /* Cap Gains */
  realizedGains: z.number().nullable(),
  dividendIncome: z.number().nullable(),
  grossCapGains: z.number().nullable(),
  taxableCapGains: z.number().nullable(),
  annualCapGainsTax: z.number().nullable(),
  cumulativeCapGainsTax: z.number().nullable(),
  effectiveCapGainsTaxRate: z.number().nullable(),
  topMarginalCapGainsTaxRate: z.number().nullable(),

  /* Early Withdrawal Penalties */
  annualEarlyWithdrawalPenalties: z.number().nullable(),
  cumulativeEarlyWithdrawalPenalties: z.number().nullable(),

  /* Totals */
  annualTotalTaxesAndPenalties: z.number().nullable(),
  cumulativeTotalTaxesAndPenalties: z.number().nullable(),

  /* Adjustments & Deductions */
  taxDeferredContributions: z.number().nullable(),
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
  adjustedGrossIncome: { title: 'Adjusted Gross Income (AGI)', format: 'currency' },
  totalTaxableIncome: { title: 'Total Taxable Income', format: 'currency' },
  earnedIncome: { title: 'Earned Income', format: 'currency' },
  taxDeferredWithdrawals: { title: 'Tax-Deferred Withdrawals', format: 'currency' },
  earlyRothEarningsWithdrawals: { title: 'Early Roth Earnings Withdrawals', format: 'currency' },
  totalRetirementDistributions: { title: 'Total Retirement Distributions', format: 'currency' },
  interestIncome: { title: 'Interest Income', format: 'currency' },
  grossOrdinaryIncome: { title: 'Gross Ordinary Income', format: 'currency' },
  taxableOrdinaryIncome: { title: 'Taxable Ordinary Income', format: 'currency' },
  annualIncomeTax: { title: 'Annual Income Tax', format: 'currency' },
  cumulativeIncomeTax: { title: 'Cumulative Income Tax', format: 'currency' },
  effectiveIncomeTaxRate: { title: 'Effective Income Tax Rate', format: 'percentage' },
  topMarginalIncomeTaxRate: { title: 'Top Marginal Income Tax Rate', format: 'percentage' },
  realizedGains: { title: 'Realized Capital Gains', format: 'currency' },
  dividendIncome: { title: 'Dividend Income', format: 'currency' },
  grossCapGains: { title: 'Gross Capital Gains', format: 'currency' },
  taxableCapGains: { title: 'Taxable Capital Gains', format: 'currency' },
  annualCapGainsTax: { title: 'Annual Capital Gains Tax', format: 'currency' },
  cumulativeCapGainsTax: { title: 'Cumulative Capital Gains Tax', format: 'currency' },
  effectiveCapGainsTaxRate: { title: 'Effective Capital Gains Tax Rate', format: 'percentage' },
  topMarginalCapGainsTaxRate: { title: 'Top Marginal Capital Gains Tax Rate', format: 'percentage' },
  annualEarlyWithdrawalPenalties: { title: 'Annual Early Withdrawal Penalties', format: 'currency' },
  cumulativeEarlyWithdrawalPenalties: { title: 'Cumulative Early Withdrawal Penalties', format: 'currency' },
  annualTotalTaxesAndPenalties: { title: 'Annual Total Taxes & Penalties', format: 'currency' },
  cumulativeTotalTaxesAndPenalties: { title: 'Cumulative Total Taxes & Penalties', format: 'currency' },
  taxDeferredContributions: { title: 'Tax-Deferred Contributions', format: 'currency' },
  standardDeduction: { title: 'Standard Deduction', format: 'currency' },
  capitalLossDeduction: { title: 'Capital Loss Deduction', format: 'currency' },
  historicalYear: { title: 'Historical Year', format: 'number' },
} as const;

export const SIMULATION_TAXES_TABLE_CONFIG: Record<keyof SingleSimulationTaxesTableRow, { title: string; format: ColumnFormat }> =
  SINGLE_SIMULATION_TAXES_COLUMNS;

// ================================
// CONTRIBUTIONS TABLE SCHEMA
// ================================

export const singleSimulationContributionsTableRowSchema = z.object({
  year: z.number(),
  age: z.number(),
  phaseName: z.string().nullable(),
  annualContributions: z.number().nullable(),
  cumulativeContributions: z.number().nullable(),
  taxableBrokerage: z.number().nullable(),
  taxDeferred: z.number().nullable(),
  taxFree: z.number().nullable(),
  cashSavings: z.number().nullable(),
  totalPortfolioValue: z.number().nullable(),
  operatingCashFlow: z.number().nullable(),
  historicalYear: z.number().nullable(),
});

export type SingleSimulationContributionsTableRow = z.infer<typeof singleSimulationContributionsTableRowSchema>;

const SINGLE_SIMULATION_CONTRIBUTIONS_COLUMNS = {
  year: { title: 'Year', format: 'number' },
  age: { title: 'Age', format: 'number' },
  phaseName: { title: 'Phase Name', format: 'string' },
  annualContributions: { title: 'Annual Contributions', format: 'currency' },
  cumulativeContributions: { title: 'Cumulative Contributions', format: 'currency' },
  taxableBrokerage: { title: 'Taxable Brokerage Contributions', format: 'currency' },
  taxDeferred: { title: 'Tax-Deferred Contributions', format: 'currency' },
  taxFree: { title: 'Tax-Free Contributions', format: 'currency' },
  cashSavings: { title: 'Cash Savings Contributions', format: 'currency' },
  totalPortfolioValue: { title: 'Total Portfolio Value', format: 'currency' },
  operatingCashFlow: { title: 'Operating Cash Flow', format: 'currency' },
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
  taxableBrokerage: z.number().nullable(),
  taxDeferred: z.number().nullable(),
  taxFree: z.number().nullable(),
  cashSavings: z.number().nullable(),
  annualRealizedGains: z.number().nullable(),
  cumulativeRealizedGains: z.number().nullable(),
  annualRequiredMinimumDistributions: z.number().nullable(),
  cumulativeRequiredMinimumDistributions: z.number().nullable(),
  annualEarlyWithdrawals: z.number().nullable(),
  cumulativeEarlyWithdrawals: z.number().nullable(),
  annualEarlyWithdrawalPenalties: z.number().nullable(),
  cumulativeEarlyWithdrawalPenalties: z.number().nullable(),
  annualRothEarningsWithdrawals: z.number().nullable(),
  cumulativeRothEarningsWithdrawals: z.number().nullable(),
  totalPortfolioValue: z.number().nullable(),
  operatingCashFlow: z.number().nullable(),
  withdrawalRate: z.number().nullable(),
  historicalYear: z.number().nullable(),
});

export type SingleSimulationWithdrawalsTableRow = z.infer<typeof singleSimulationWithdrawalsTableRowSchema>;

const SINGLE_SIMULATION_WITHDRAWALS_COLUMNS = {
  year: { title: 'Year', format: 'number' },
  age: { title: 'Age', format: 'number' },
  phaseName: { title: 'Phase Name', format: 'string' },
  annualWithdrawals: { title: 'Annual Withdrawals', format: 'currency' },
  cumulativeWithdrawals: { title: 'Cumulative Withdrawals', format: 'currency' },
  taxableBrokerage: { title: 'Taxable Brokerage Withdrawals', format: 'currency' },
  taxDeferred: { title: 'Tax-Deferred Withdrawals', format: 'currency' },
  taxFree: { title: 'Tax-Free Withdrawals', format: 'currency' },
  cashSavings: { title: 'Cash Savings Withdrawals', format: 'currency' },
  annualRealizedGains: { title: 'Annual Realized Gains', format: 'currency' },
  cumulativeRealizedGains: { title: 'Cumulative Realized Gains', format: 'currency' },
  annualRequiredMinimumDistributions: { title: 'Annual RMDs', format: 'currency' },
  cumulativeRequiredMinimumDistributions: { title: 'Cumulative RMDs', format: 'currency' },
  annualEarlyWithdrawals: { title: 'Annual Early Withdrawals', format: 'currency' },
  cumulativeEarlyWithdrawals: { title: 'Cumulative Early Withdrawals', format: 'currency' },
  annualEarlyWithdrawalPenalties: { title: 'Annual Early Withdrawal Penalties', format: 'currency' },
  cumulativeEarlyWithdrawalPenalties: { title: 'Cumulative Early Withdrawal Penalties', format: 'currency' },
  annualRothEarningsWithdrawals: { title: 'Annual Roth Earnings Withdrawals', format: 'currency' },
  cumulativeRothEarningsWithdrawals: { title: 'Cumulative Roth Earnings Withdrawals', format: 'currency' },
  totalPortfolioValue: { title: 'Total Portfolio Value', format: 'currency' },
  operatingCashFlow: { title: 'Operating Cash Flow', format: 'currency' },
  withdrawalRate: { title: 'Withdrawal Rate', format: 'percentage' },
  historicalYear: { title: 'Historical Year', format: 'number' },
} as const;

export const SIMULATION_WITHDRAWALS_TABLE_CONFIG: Record<
  keyof SingleSimulationWithdrawalsTableRow,
  { title: string; format: ColumnFormat }
> = SINGLE_SIMULATION_WITHDRAWALS_COLUMNS;
