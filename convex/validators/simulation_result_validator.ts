import { v, type Infer } from 'convex/values';

const taxBracketValidator = v.object({
  rate: v.number(),
  min: v.number(),
  max: v.number(),
});

export const simulationDataPointValidator = v.object({
  age: v.number(),
  phaseName: v.union(v.literal('accum'), v.literal('retire'), v.null()),

  // Net Worth
  netWorth: v.number(),
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
  taxFreeIncome: v.number(),
  retirementDistributions: v.number(),
  interestIncome: v.number(),
  realizedGains: v.number(),
  dividendIncome: v.number(),
  taxesAndPenalties: v.number(),
  expenses: v.number(),
  surplusDeficit: v.number(),
  savingsRate: v.nullable(v.number()),
  netCashFlow: v.number(),

  // Taxes
  grossIncome: v.number(),
  adjustedGrossIncome: v.number(),
  taxableIncome: v.number(),

  ficaTax: v.number(),
  fedIncomeTax: v.number(),
  fedCapitalGainsTax: v.number(),
  niit: v.number(),
  earlyWithdrawalPenalties: v.number(),

  netInvestmentIncome: v.number(),

  effectiveFedIncomeTaxRate: v.number(),
  topMarginalFedIncomeTaxRate: v.number(),
  effectiveFedCapitalGainsTaxRate: v.number(),
  topMarginalFedCapitalGainsTaxRate: v.number(),

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

  // Debts
  unsecuredDebtBalance: v.number(),
  securedDebtBalance: v.number(),
  debtPayments: v.number(),
  debtPaydown: v.number(),
  debtPayoff: v.number(),
  debtIncurred: v.number(),

  // Physical Assets
  assetValue: v.number(),
  assetEquity: v.number(),
  assetPurchaseOutlay: v.number(),
  assetSaleProceeds: v.number(),
  assetAppreciation: v.number(),

  // Returns
  realStockReturnRate: v.number(),
  realBondReturnRate: v.number(),
  realCashReturnRate: v.number(),
  inflationRate: v.number(),
  annualStockGain: v.number(),
  annualBondGain: v.number(),
  annualCashGain: v.number(),
  totalAnnualGains: v.number(),
});

export type SimulationDataPoint = Infer<typeof simulationDataPointValidator>;

export const simulationResultValidator = v.object({
  simulationResult: v.array(simulationDataPointValidator),
  fedIncomeTaxBrackets: v.array(taxBracketValidator),
  fedCapitalGainsTaxBrackets: v.array(taxBracketValidator),
  standardDeduction: v.number(),
  niitThreshold: v.number(),
});

export type SimulationResult = Infer<typeof simulationResultValidator>;
