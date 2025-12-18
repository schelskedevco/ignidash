import { v, type Infer } from 'convex/values';

const taxBracketValidator = v.object({
  rate: v.number(),
  min: v.number(),
  max: v.number(),
});

export const simulationDataPointValidator = v.object({
  age: v.number(),

  // Portfolio
  stockHoldings: v.number(),
  bondHoldings: v.number(),
  cashHoldings: v.number(),
  taxableValue: v.number(),
  taxDeferredValue: v.number(),
  taxFreeValue: v.number(),
  cashSavings: v.number(),
  totalValue: v.number(),

  // Cash Flow
  earnedIncome: v.number(),
  socialSecurityIncome: v.number(),
  taxExemptIncome: v.number(),
  retirementDistributions: v.number(),
  interestIncome: v.number(),
  realizedGains: v.number(),
  dividendIncome: v.number(),
  totalTaxesAndPenalties: v.number(),
  expenses: v.number(),
  netCashFlow: v.number(),
  savingsRate: v.nullable(v.number()),

  // Returns
  realStockReturn: v.number(),
  realBondReturn: v.number(),
  realCashReturn: v.number(),
  inflationRate: v.number(),
  cumulativeStockGrowth: v.number(),
  cumulativeBondGrowth: v.number(),
  cumulativeCashGrowth: v.number(),
  annualStockGrowth: v.number(),
  annualBondGrowth: v.number(),
  annualCashGrowth: v.number(),

  // Taxes
  grossIncome: v.number(),
  adjustedGrossIncome: v.number(),
  taxableIncome: v.number(),

  /* Tax Amounts */
  ficaTax: v.number(),
  federalIncomeTax: v.number(),
  capitalGainsTax: v.number(),
  earlyWithdrawalPenalties: v.number(),

  /* Taxable Income */
  taxableOrdinaryIncome: v.number(),
  taxableCapitalGains: v.number(),
  taxableSocialSecurityIncome: v.number(),

  /* Tax Rates */
  effectiveIncomeTaxRate: v.number(),
  topMarginalIncomeTaxRate: v.number(),
  incomeTaxBrackets: v.array(taxBracketValidator),
  effectiveCapitalGainsTaxRate: v.number(),
  topMarginalCapitalGainsTaxRate: v.number(),
  capitalGainsTaxBrackets: v.array(taxBracketValidator),

  /* Social Security */
  maxTaxablePercentage: v.number(),
  actualTaxablePercentage: v.number(),

  /* Adjustments & Deductions */
  taxDeferredContributionsDeduction: v.number(),
  standardDeduction: v.number(),
  capitalLossDeduction: v.number(),

  // Contributions
  annualContributions: v.number(),
  cumulativeContributions: v.number(),
  taxableContributions: v.number(),
  taxDeferredContributions: v.number(),
  taxFreeContributions: v.number(),
  cashContributions: v.number(),
  employerMatch: v.number(),

  // Withdrawals
  annualWithdrawals: v.number(),
  cumulativeWithdrawals: v.number(),
  taxableWithdrawals: v.number(),
  taxDeferredWithdrawals: v.number(),
  taxFreeWithdrawals: v.number(),
  cashWithdrawals: v.number(),
  requiredMinimumDistributions: v.number(),
  earlyWithdrawals: v.number(),
  rothEarningsWithdrawals: v.number(),
  withdrawalRate: v.nullable(v.number()),
  // ...

  // Monte Carlo
  // ...
});

export const simulationResultValidator = v.object({
  simulationResult: v.array(simulationDataPointValidator),
});

export type SimulationResult = Infer<typeof simulationResultValidator>;
