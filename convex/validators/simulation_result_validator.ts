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
  stockGrowth: v.number(),
  bondGrowth: v.number(),
  cashGrowth: v.number(),

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
  taxableSocialSecurityIncome: v.number(),

  effectiveIncomeTaxRate: v.number(),
  topMarginalIncomeTaxRate: v.number(),
  effectiveCapitalGainsTaxRate: v.number(),
  topMarginalCapitalGainsTaxRate: v.number(),

  maxTaxablePercentage: v.number(),
  actualTaxablePercentage: v.number(),

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

  // Monte Carlo
  monteCarlo: v.nullable(
    v.object({
      p10PortfolioValue: v.number(),
      p25PortfolioValue: v.number(),
      p50PortfolioValue: v.number(),
      p75PortfolioValue: v.number(),
      p90PortfolioValue: v.number(),

      percentAccumulation: v.number(),
      percentRetirement: v.number(),
      percentBankrupt: v.number(),

      chanceOfRetirement: v.number(),
      chanceOfBankruptcy: v.number(),

      meanYearsToRetirement: v.number(),
      minYearsToRetirement: v.number(),
      maxYearsToRetirement: v.number(),

      meanRetirementAge: v.number(),
      minRetirementAge: v.number(),
      maxRetirementAge: v.number(),

      meanYearsToBankruptcy: v.number(),
      minYearsToBankruptcy: v.number(),
      maxYearsToBankruptcy: v.number(),

      meanBankruptcyAge: v.number(),
      minBankruptcyAge: v.number(),
      maxBankruptcyAge: v.number(),
    })
  ),
});

export const simulationResultValidator = v.object({
  simulationResult: v.array(simulationDataPointValidator),
  incomeTaxBrackets: v.array(taxBracketValidator),
  capitalGainsTaxBrackets: v.array(taxBracketValidator),
});

export type SimulationResult = Infer<typeof simulationResultValidator>;
