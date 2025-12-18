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

  // Taxes
  grossIncome: v.number(),
  adjustedGrossIncome: v.number(),
  taxableIncome: v.number(),

  ficaTax: v.number(),
  federalIncomeTax: v.number(),
  capitalGainsTax: v.number(),
  earlyWithdrawalPenalties: v.number(),

  taxableOrdinaryIncome: v.number(),
  taxableCapitalGains: v.number(),

  effectiveIncomeTaxRate: v.number(),
  topMarginalIncomeTaxRate: v.number(),
  effectiveCapitalGainsTaxRate: v.number(),
  topMarginalCapitalGainsTaxRate: v.number(),

  taxDeferredContributionsDeduction: v.number(),
  capitalLossDeduction: v.number(),

  // Contributions
  totalContributions: v.number(),
  taxableContributions: v.number(),
  taxDeferredContributions: v.number(),
  taxFreeContributions: v.number(),
  cashContributions: v.number(),
  employerMatch: v.number(),

  // Withdrawals
  totalWithdrawals: v.number(),
  taxableWithdrawals: v.number(),
  taxDeferredWithdrawals: v.number(),
  taxFreeWithdrawals: v.number(),
  cashWithdrawals: v.number(),
  requiredMinimumDistributions: v.number(),
  earlyWithdrawals: v.number(),
  rothEarningsWithdrawals: v.number(),
  withdrawalRate: v.nullable(v.number()),

  // Monte Carlo
  monteCarlo: v.nullable(
    v.object({
      p10PortfolioValue: v.number(),
      p50PortfolioValue: v.number(),
      p90PortfolioValue: v.number(),
      percentRetirement: v.number(),
      percentBankrupt: v.number(),
    })
  ),
});

export const simulationResultValidator = v.object({
  simulationResult: v.array(simulationDataPointValidator),
  incomeTaxBrackets: v.array(taxBracketValidator),
  capitalGainsTaxBrackets: v.array(taxBracketValidator),
  standardDeduction: v.number(),
});

export type SimulationResult = Infer<typeof simulationResultValidator>;
