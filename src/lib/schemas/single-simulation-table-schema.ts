import { z } from 'zod';

import type { ColumnFormat } from '@/lib/types/column-format';

// ================================
// PORTFOLIO TABLE SCHEMA
// ================================

export const singleSimulationTableRowSchema = z.object({
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
  taxableBrokerageHoldings: z.number().nullable(),
  taxDeferredHoldings: z.number().nullable(),
  taxFreeHoldings: z.number().nullable(),
  cashSavings: z.number().nullable(),
  historicalYear: z.number().nullable(),
  // perAccountData: AccountDataWithTransactions[];
});

export type SingleSimulationTableRow = z.infer<typeof singleSimulationTableRowSchema>;

const SINGLE_SIMULATION_COLUMNS = {
  year: { title: 'Year', format: 'number' },
  age: { title: 'Age', format: 'number' },
  phaseName: { title: 'Phase Name', format: 'string' },
  totalPortfolioValue: { title: 'Total Portfolio Value', format: 'currency' },
  annualReturns: { title: 'Annual Returns', format: 'currency' },
  annualWithdrawals: { title: 'Annual Withdrawals', format: 'currency' },
  annualContributions: { title: 'Annual Contributions', format: 'currency' },
  netPortfolioChange: { title: 'Net Portfolio Change', format: 'currency' },
  stockHoldings: { title: 'Stock Holdings', format: 'currency' },
  bondHoldings: { title: 'Bond Holdings', format: 'currency' },
  cashHoldings: { title: 'Cash Holdings', format: 'currency' },
  taxableBrokerageHoldings: { title: 'Taxable Brokerage Holdings', format: 'currency' },
  taxDeferredHoldings: { title: 'Tax-Deferred Holdings', format: 'currency' },
  taxFreeHoldings: { title: 'Tax-Free Holdings', format: 'currency' },
  cashSavings: { title: 'Cash Savings', format: 'currency' },
  historicalYear: { title: 'Historical Year', format: 'number' },
  // perAccountData: { title: 'Per Account Data', format: 'json' },
} as const;

export const SIMULATION_TABLE_CONFIG: Record<keyof SingleSimulationTableRow, { title: string; format: ColumnFormat }> =
  SINGLE_SIMULATION_COLUMNS;

// ================================
// CASH FLOW TABLE SCHEMA
// ================================

export const singleSimulationCashFlowTableRowSchema = z.object({
  year: z.number(),
  age: z.number(),
  phaseName: z.string().nullable(),
  ordinaryIncome: z.number().nullable(),
  taxDeferredWithdrawals: z.number().nullable(),
  grossIncome: z.number().nullable(),
  incomeTax: z.number().nullable(),
  netIncome: z.number().nullable(),
  expenses: z.number().nullable(),
  netCashFlow: z.number().nullable(),
  savingsRate: z.number().nullable(),
  historicalYear: z.number().nullable(),
  // perIncomeData: IncomeData[];
  // perExpenseData: ExpenseData[];
});

export type SingleSimulationCashFlowTableRow = z.infer<typeof singleSimulationCashFlowTableRowSchema>;

const SINGLE_SIMULATION_CASHFLOW_COLUMNS = {
  year: { title: 'Year', format: 'number' },
  age: { title: 'Age', format: 'number' },
  phaseName: { title: 'Phase Name', format: 'string' },
  ordinaryIncome: { title: 'Ordinary Income', format: 'currency' },
  taxDeferredWithdrawals: { title: 'Tax-Deferred Withdrawals', format: 'currency' },
  grossIncome: { title: 'Gross Income', format: 'currency' },
  incomeTax: { title: 'Income Tax', format: 'currency' },
  netIncome: { title: 'Net Income', format: 'currency' },
  expenses: { title: 'Expenses', format: 'currency' },
  netCashFlow: { title: 'Net Cash Flow', format: 'currency' },
  savingsRate: { title: 'Savings Rate', format: 'percentage' },
  historicalYear: { title: 'Historical Year', format: 'number' },
  // perIncomeData: { title: 'Per Income Data', format: 'json' },
  // perExpenseData: { title: 'Per Expense Data', format: 'json' },
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
  totalPortfolioValue: z.number().nullable(),
  stockRate: z.number().nullable(),
  totalStockAmount: z.number().nullable(),
  stockAmount: z.number().nullable(),
  stockHoldings: z.number().nullable(),
  bondRate: z.number().nullable(),
  totalBondAmount: z.number().nullable(),
  bondAmount: z.number().nullable(),
  bondHoldings: z.number().nullable(),
  cashRate: z.number().nullable(),
  totalCashAmount: z.number().nullable(),
  cashAmount: z.number().nullable(),
  cashHoldings: z.number().nullable(),
  inflationRate: z.number().nullable(),
  historicalYear: z.number().nullable(),
});

export type SingleSimulationReturnsTableRow = z.infer<typeof singleSimulationReturnsTableRowSchema>;

const SINGLE_SIMULATION_RETURNS_COLUMNS = {
  year: { title: 'Year', format: 'number' },
  age: { title: 'Age', format: 'number' },
  phaseName: { title: 'Phase Name', format: 'string' },
  totalPortfolioValue: { title: 'Total Portfolio Value', format: 'currency' },
  stockRate: { title: 'Stock Rate', format: 'percentage' },
  totalStockAmount: { title: 'Total Stock Amount', format: 'currency' },
  stockAmount: { title: 'Stock Amount', format: 'currency' },
  stockHoldings: { title: 'Stock Holdings', format: 'currency' },
  bondRate: { title: 'Bond Rate', format: 'percentage' },
  totalBondAmount: { title: 'Total Bond Amount', format: 'currency' },
  bondAmount: { title: 'Bond Amount', format: 'currency' },
  bondHoldings: { title: 'Bond Holdings', format: 'currency' },
  cashRate: { title: 'Cash Rate', format: 'percentage' },
  totalCashAmount: { title: 'Total Cash Amount', format: 'currency' },
  cashAmount: { title: 'Cash Amount', format: 'currency' },
  cashHoldings: { title: 'Cash Holdings', format: 'currency' },
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
  taxableOrdinaryIncome: z.number().nullable(),
  annualIncomeTaxAmount: z.number().nullable(),
  totalIncomeTaxAmount: z.number().nullable(),
  effectiveIncomeTaxRate: z.number().nullable(),
  topMarginalIncomeTaxRate: z.number().nullable(),
  netIncome: z.number().nullable(),
  capitalLossDeduction: z.number().nullable(),
  taxableCapGains: z.number().nullable(),
  annualCapGainsTaxAmount: z.number().nullable(),
  totalCapGainsTaxAmount: z.number().nullable(),
  effectiveCapGainsTaxRate: z.number().nullable(),
  topMarginalCapGainsTaxRate: z.number().nullable(),
  netCapGains: z.number().nullable(),
  totalTaxableIncome: z.number().nullable(),
  totalAnnualTaxAmount: z.number().nullable(),
  totalTaxAmount: z.number().nullable(),
  totalNetIncome: z.number().nullable(),
  realizedCapGains: z.number().nullable(),
  historicalYear: z.number().nullable(),
  // adjustments: Record<string, number>;
  // deductions: Record<string, number>;
});

export type SingleSimulationTaxesTableRow = z.infer<typeof singleSimulationTaxesTableRowSchema>;

const SINGLE_SIMULATION_TAXES_COLUMNS = {
  year: { title: 'Year', format: 'number' },
  age: { title: 'Age', format: 'number' },
  phaseName: { title: 'Phase Name', format: 'string' },
  grossIncome: { title: 'Gross Income', format: 'currency' },
  taxableOrdinaryIncome: { title: 'Taxable Ordinary Income', format: 'currency' },
  annualIncomeTaxAmount: { title: 'Annual Income Tax Amount', format: 'currency' },
  totalIncomeTaxAmount: { title: 'Total Income Tax Amount', format: 'currency' },
  effectiveIncomeTaxRate: { title: 'Effective Income Tax Rate', format: 'percentage' },
  topMarginalIncomeTaxRate: { title: 'Top Marginal Income Tax Rate', format: 'percentage' },
  netIncome: { title: 'Net Income', format: 'currency' },
  capitalLossDeduction: { title: 'Capital Loss Deduction', format: 'currency' },
  taxableCapGains: { title: 'Taxable Capital Gains', format: 'currency' },
  annualCapGainsTaxAmount: { title: 'Annual Capital Gains Tax Amount', format: 'currency' },
  totalCapGainsTaxAmount: { title: 'Total Capital Gains Tax Amount', format: 'currency' },
  effectiveCapGainsTaxRate: { title: 'Effective Capital Gains Tax Rate', format: 'percentage' },
  topMarginalCapGainsTaxRate: { title: 'Top Marginal Capital Gains Tax Rate', format: 'percentage' },
  netCapGains: { title: 'Net Capital Gains', format: 'currency' },
  totalTaxableIncome: { title: 'Total Taxable Income', format: 'currency' },
  totalAnnualTaxAmount: { title: 'Total Annual Tax Amount', format: 'currency' },
  totalTaxAmount: { title: 'Total Tax Amount', format: 'currency' },
  totalNetIncome: { title: 'Total Net Income', format: 'currency' },
  realizedCapGains: { title: 'Realized Capital Gains', format: 'currency' },
  historicalYear: { title: 'Historical Year', format: 'number' },
  // adjustments: { title: 'Adjustments', format: 'json' },
  // deductions: { title: 'Deductions', format: 'json' },
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
  totalContributions: z.number().nullable(),
  annualContributions: z.number().nullable(),
  taxableBrokerage: z.number().nullable(),
  taxDeferred: z.number().nullable(),
  taxFree: z.number().nullable(),
  cashSavings: z.number().nullable(),
  totalPortfolioValue: z.number().nullable(),
  netCashFlow: z.number().nullable(),
  historicalYear: z.number().nullable(),
  // perAccountData: AccountDataWithTransactions[];
});

export type SingleSimulationContributionsTableRow = z.infer<typeof singleSimulationContributionsTableRowSchema>;

const SINGLE_SIMULATION_CONTRIBUTIONS_COLUMNS = {
  year: { title: 'Year', format: 'number' },
  age: { title: 'Age', format: 'number' },
  phaseName: { title: 'Phase Name', format: 'string' },
  totalContributions: { title: 'Total Contributions', format: 'currency' },
  annualContributions: { title: 'Annual Contributions', format: 'currency' },
  taxableBrokerage: { title: 'Taxable Brokerage', format: 'currency' },
  taxDeferred: { title: 'Tax-Deferred', format: 'currency' },
  taxFree: { title: 'Tax-Free', format: 'currency' },
  cashSavings: { title: 'Cash Savings', format: 'currency' },
  totalPortfolioValue: { title: 'Total Portfolio Value', format: 'currency' },
  netCashFlow: { title: 'Net Cash Flow', format: 'currency' },
  historicalYear: { title: 'Historical Year', format: 'number' },
  // perAccountData: { title: 'Per Account Data', format: 'json' },
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
  totalWithdrawals: z.number().nullable(),
  totalRealizedGains: z.number().nullable(),
  annualWithdrawals: z.number().nullable(),
  annualRealizedGains: z.number().nullable(),
  taxableBrokerage: z.number().nullable(),
  taxDeferred: z.number().nullable(),
  taxFree: z.number().nullable(),
  cashSavings: z.number().nullable(),
  totalPortfolioValue: z.number().nullable(),
  netCashFlow: z.number().nullable(),
  withdrawalRate: z.number().nullable(),
  historicalYear: z.number().nullable(),
  // perAccountData: AccountDataWithTransactions[];
});

export type SingleSimulationWithdrawalsTableRow = z.infer<typeof singleSimulationWithdrawalsTableRowSchema>;

const SINGLE_SIMULATION_WITHDRAWALS_COLUMNS = {
  year: { title: 'Year', format: 'number' },
  age: { title: 'Age', format: 'number' },
  phaseName: { title: 'Phase Name', format: 'string' },
  totalWithdrawals: { title: 'Total Withdrawals', format: 'currency' },
  totalRealizedGains: { title: 'Total Realized Gains', format: 'currency' },
  annualWithdrawals: { title: 'Annual Withdrawals', format: 'currency' },
  annualRealizedGains: { title: 'Annual Realized Gains', format: 'currency' },
  taxableBrokerage: { title: 'Taxable Brokerage', format: 'currency' },
  taxDeferred: { title: 'Tax-Deferred', format: 'currency' },
  taxFree: { title: 'Tax-Free', format: 'currency' },
  cashSavings: { title: 'Cash Savings', format: 'currency' },
  totalPortfolioValue: { title: 'Total Portfolio Value', format: 'currency' },
  netCashFlow: { title: 'Net Cash Flow', format: 'currency' },
  withdrawalRate: { title: 'Withdrawal Rate', format: 'percentage' },
  historicalYear: { title: 'Historical Year', format: 'number' },
  // perAccountData: { title: 'Per Account Data', format: 'json' },
} as const;

export const SIMULATION_WITHDRAWALS_TABLE_CONFIG: Record<
  keyof SingleSimulationWithdrawalsTableRow,
  { title: string; format: ColumnFormat }
> = SINGLE_SIMULATION_WITHDRAWALS_COLUMNS;
