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

  // Income & Expenses
  earnedIncome: v.number(),
  socialSecurityIncome: v.number(),
  nonTaxableIncome: v.number(),
  retirementDistributions: v.number(),
  interestIncome: v.number(),
  realizedGains: v.number(),
  dividendIncome: v.number(),
  taxesAndPenalties: v.number(),
  expenses: v.number(),
  surplusDeficit: v.number(),
  savingsRate: v.nullable(v.number()),

  // Taxes
  grossIncome: v.number(),
  adjustedGrossIncome: v.number(),
  taxableIncome: v.number(),

  ficaTax: v.number(),
  federalIncomeTax: v.number(),
  capitalGainsTax: v.number(),
  niit: v.number(),
  earlyWithdrawalPenalties: v.number(),

  netInvestmentIncome: v.number(),
  incomeSubjectToNiit: v.number(),

  effectiveIncomeTaxRate: v.number(),
  topMarginalIncomeTaxRate: v.number(),
  effectiveCapitalGainsTaxRate: v.number(),
  topMarginalCapitalGainsTaxRate: v.number(),

  taxDeductibleContributions: v.number(),
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
});

export type SimulationDataPoint = Infer<typeof simulationDataPointValidator>;

export const simulationResultValidator = v.object({
  simulationResult: v.array(simulationDataPointValidator),
  incomeTaxBrackets: v.array(taxBracketValidator),
  capitalGainsTaxBrackets: v.array(taxBracketValidator),
  standardDeduction: v.number(),
  niitThreshold: v.number(),
});

export type SimulationResult = Infer<typeof simulationResultValidator>;
