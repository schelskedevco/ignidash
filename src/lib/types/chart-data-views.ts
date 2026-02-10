export type NetWorthDataView =
  | 'assetClass'
  | 'taxCategory'
  | 'netPortfolioChange'
  | 'netWorth'
  | 'netWorthChange'
  | 'assetEquity'
  | 'netAssetChange'
  | 'debts'
  | 'netDebtReduction'
  | 'custom';

export type CashFlowDataView = 'surplusDeficit' | 'cashFlow' | 'incomes' | 'expenses' | 'custom' | 'savingsRate';

export type TaxesDataView =
  | 'marginalRates'
  | 'effectiveRates'
  | 'annualAmounts'
  | 'cumulativeAmounts'
  | 'taxableIncome'
  | 'adjustedGrossIncome'
  | 'investmentIncome'
  | 'retirementDistributions'
  | 'taxFreeIncome'
  | 'ordinaryIncome'
  | 'capGainsAndDividends'
  | 'earlyWithdrawalPenalties'
  | 'adjustmentsAndDeductions'
  | 'socialSecurityIncome'
  | 'socialSecurityTaxablePercentage';

export type ReturnsDataView = 'rates' | 'cagr' | 'annualAmounts' | 'cumulativeAmounts' | 'taxCategory' | 'appreciation' | 'custom';

export type ContributionsDataView = 'annualAmounts' | 'cumulativeAmounts' | 'taxCategory' | 'custom' | 'employerMatch' | 'shortfall';

export type WithdrawalsDataView =
  | 'annualAmounts'
  | 'cumulativeAmounts'
  | 'taxCategory'
  | 'realizedGains'
  | 'requiredMinimumDistributions'
  | 'earlyWithdrawals'
  | 'shortfall'
  | 'withdrawalRate'
  | 'custom';
