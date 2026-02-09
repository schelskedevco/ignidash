import type { Doc } from '@/convex/_generated/dataModel';
import type { SimulationResult as ConvexSimulationResult } from '@/convex/validators/simulation_result_validator';

import { ChartDataExtractor } from '@/lib/calc/data-extractors/chart-data-extractor';
import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import type { ContributionInputs, BaseContributionInputs } from '@/lib/schemas/inputs/contribution-form-schema';
import type { IncomeInputs } from '@/lib/schemas/inputs/income-form-schema';
import type { ExpenseInputs } from '@/lib/schemas/inputs/expense-form-schema';
import type { DebtInputs } from '@/lib/schemas/inputs/debt-form-schema';
import type { PhysicalAssetInputs } from '@/lib/schemas/inputs/physical-asset-form-schema';
import type { MarketAssumptionsInputs } from '@/lib/schemas/inputs/market-assumptions-schema';
import type { TimelineInputs } from '@/lib/schemas/inputs/timeline-form-schema';
import type { TaxSettingsInputs } from '@/lib/schemas/inputs/tax-settings-schema';
import type { PrivacySettingsInputs } from '@/lib/schemas/inputs/privacy-settings-schema';
import type { SimulationSettingsInputs } from '@/lib/schemas/simulation-settings-schema';
import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';
import type { AssetInputs } from '@/lib/schemas/finances/asset-schema';
import type { LiabilityInputs } from '@/lib/schemas/finances/liability-schema';
import type { GlidePathInputs } from '@/lib/schemas/inputs/glide-path-schema';
import type { SimulationResult } from '@/lib/calc/simulation-engine';

// ============================================================================
// CONVEX TO ZOD TRANSFORMERS
// ============================================================================

/**
 * Transforms a Convex account to Zod AccountInputs format
 */
export function accountFromConvex(account: Doc<'plans'>['accounts'][number]): AccountInputs {
  const base = { id: account.id, name: account.name, balance: account.balance };

  switch (account.type) {
    case 'savings':
      return { ...base, type: 'savings' };
    case 'taxableBrokerage':
      return { ...base, type: 'taxableBrokerage', percentBonds: account.percentBonds!, costBasis: account.costBasis };
    case 'roth401k':
    case 'roth403b':
    case 'rothIra':
      return { ...base, type: account.type, percentBonds: account.percentBonds!, contributionBasis: account.contributionBasis };
    case '401k':
    case '403b':
    case 'ira':
    case 'hsa':
      return { ...base, type: account.type, percentBonds: account.percentBonds! };
  }
}

/**
 * Transforms a Convex contribution rule to Zod ContributionInputs format
 */
export function contributionFromConvex(contribution: Doc<'plans'>['contributionRules'][number]): ContributionInputs {
  const base = {
    id: contribution.id,
    accountId: contribution.accountId,
    rank: contribution.rank,
    maxBalance: contribution.maxBalance,
    incomeIds: contribution.incomeIds,
    disabled: contribution.disabled ?? false,
    employerMatch: contribution.employerMatch,
    enableMegaBackdoorRoth: contribution.enableMegaBackdoorRoth,
  };

  switch (contribution.amount.type) {
    case 'dollarAmount':
      return { ...base, contributionType: 'dollarAmount', dollarAmount: contribution.amount.dollarAmount };
    case 'percentRemaining':
      return { ...base, contributionType: 'percentRemaining', percentRemaining: contribution.amount.percentRemaining };
    case 'unlimited':
      return { ...base, contributionType: 'unlimited' };
  }
}

/**
 * Transforms a Convex base contribution rule to Zod BaseContributionInputs format
 */
export function baseContributionFromConvex(baseContribution: Doc<'plans'>['baseContributionRule']): BaseContributionInputs {
  return { type: baseContribution.type };
}

/**
 * Transforms Convex tax settings to Zod TaxSettingsInputs format
 */
export function taxSettingsFromConvex(taxSettings: Doc<'plans'>['taxSettings']): TaxSettingsInputs {
  return { filingStatus: taxSettings.filingStatus };
}

/**
 * Transforms Convex privacy settings to Zod PrivacySettingsInputs format
 */
export function privacySettingsFromConvex(privacySettings: Doc<'plans'>['privacySettings']): PrivacySettingsInputs {
  return { isPrivate: privacySettings.isPrivate };
}

/**
 * Transforms Convex simulation settings to Zod SimulationSettingsInputs format
 */
export function simulationSettingsFromConvex(simulationSettings: Doc<'plans'>['simulationSettings']): SimulationSettingsInputs {
  return { ...simulationSettings };
}

/**
 * Transforms a Convex expense to Zod ExpenseInputs format
 */
export function expenseFromConvex(expense: Doc<'plans'>['expenses'][number]): ExpenseInputs {
  return {
    id: expense.id,
    name: expense.name,
    amount: expense.amount,
    frequency: expense.frequency,
    timeframe: { start: expense.timeframe.start, end: expense.timeframe.end },
    growth: expense.growth,
    disabled: expense.disabled ?? false,
  };
}

/**
 * Transforms a Convex debt to Zod DebtInputs format
 */
export function debtFromConvex(debt: NonNullable<Doc<'plans'>['debts']>[number]): DebtInputs {
  return {
    id: debt.id,
    name: debt.name,
    balance: debt.balance,
    apr: debt.apr,
    interestType: debt.interestType,
    compoundingFrequency: debt.compoundingFrequency,
    startDate: { ...debt.startDate },
    monthlyPayment: debt.monthlyPayment,
    disabled: debt.disabled ?? false,
  };
}

/**
 * Transforms a Convex physical asset to Zod PhysicalAssetInputs format
 */
export function physicalAssetFromConvex(physicalAsset: NonNullable<Doc<'plans'>['physicalAssets']>[number]): PhysicalAssetInputs {
  return {
    id: physicalAsset.id,
    name: physicalAsset.name,
    assetType: physicalAsset.assetType ?? 'other',
    purchaseDate: { ...physicalAsset.purchaseDate },
    purchasePrice: physicalAsset.purchasePrice,
    marketValue: physicalAsset.marketValue,
    appreciationRate: physicalAsset.appreciationRate,
    saleDate: physicalAsset.saleDate ? { ...physicalAsset.saleDate } : { type: 'atLifeExpectancy' },
    paymentMethod: physicalAsset.paymentMethod,
  };
}

/**
 * Transforms a Convex income to Zod IncomeInputs format
 */
export function incomeFromConvex(income: Doc<'plans'>['incomes'][number]): IncomeInputs {
  return {
    id: income.id,
    name: income.name,
    amount: income.amount,
    frequency: income.frequency,
    timeframe: { start: income.timeframe.start, end: income.timeframe.end },
    growth: income.growth,
    taxes: { incomeType: income.taxes.incomeType, withholding: income.taxes.withholding },
    disabled: income.disabled ?? false,
  };
}

/**
 * Transforms Convex market assumptions to Zod MarketAssumptionsInputs format
 */
export function marketAssumptionsFromConvex(marketAssumptions: Doc<'plans'>['marketAssumptions']): MarketAssumptionsInputs {
  return {
    stockReturn: marketAssumptions.stockReturn,
    stockYield: marketAssumptions.stockYield,
    bondReturn: marketAssumptions.bondReturn,
    bondYield: marketAssumptions.bondYield,
    cashReturn: marketAssumptions.cashReturn,
    inflationRate: marketAssumptions.inflationRate,
  };
}

/**
 * Transforms a Convex timeline to Zod TimelineInputs format
 */
export function timelineFromConvex(timeline: Doc<'plans'>['timeline']): TimelineInputs | null {
  return timeline ? structuredClone(timeline) : null;
}

/**
 * Transforms a complete Convex plan to Zod SimulatorInputs format
 */
export function simulatorFromConvex(plan: Doc<'plans'>): SimulatorInputs {
  const incomes = Object.fromEntries(plan.incomes.map((income) => [income.id, incomeFromConvex(income)]));
  const accounts = Object.fromEntries(plan.accounts.map((account) => [account.id, accountFromConvex(account)]));
  const glidePath = glidePathFromConvex(plan.glidePath);
  const expenses = Object.fromEntries(plan.expenses.map((expense) => [expense.id, expenseFromConvex(expense)]));
  const debts = Object.fromEntries((plan.debts ?? []).map((debt) => [debt.id, debtFromConvex(debt)]));
  const physicalAssets = Object.fromEntries((plan.physicalAssets ?? []).map((asset) => [asset.id, physicalAssetFromConvex(asset)]));
  const contributionRules = Object.fromEntries(plan.contributionRules.map((rule) => [rule.id, contributionFromConvex(rule)]));

  return {
    timeline: timelineFromConvex(plan.timeline),
    incomes,
    accounts,
    glidePath,
    expenses,
    debts,
    physicalAssets,
    contributionRules,
    baseContributionRule: baseContributionFromConvex(plan.baseContributionRule),
    marketAssumptions: marketAssumptionsFromConvex(plan.marketAssumptions),
    taxSettings: taxSettingsFromConvex(plan.taxSettings),
    privacySettings: privacySettingsFromConvex(plan.privacySettings),
    simulationSettings: simulationSettingsFromConvex(plan.simulationSettings),
  };
}

/**
 * Transforms a Convex asset to Zod AssetInputs format
 */
export function assetFromConvex(asset: Doc<'finances'>['assets'][number]): AssetInputs {
  return { ...asset };
}

/**
 * Transforms a Convex liability to Zod LiabilityInputs format
 */
export function liabilityFromConvex(liability: Doc<'finances'>['liabilities'][number]): LiabilityInputs {
  return { ...liability };
}

/**
 * Transforms a Convex glide path to Zod GlidePathInputs format
 */
export function glidePathFromConvex(glidePath: Doc<'plans'>['glidePath']): GlidePathInputs | undefined {
  return glidePath ? structuredClone(glidePath) : undefined;
}

// ============================================================================
// ZOD TO CONVEX TRANSFORMERS
// ============================================================================

/**
 * Transforms Zod AccountInputs to Convex account format
 */
export function accountToConvex(account: AccountInputs): Doc<'plans'>['accounts'][number] {
  const base = { id: account.id, name: account.name, balance: account.balance };

  switch (account.type) {
    case 'savings':
      return { ...base, type: 'savings' };
    case 'taxableBrokerage':
      return { ...base, type: 'taxableBrokerage', percentBonds: account.percentBonds, costBasis: account.costBasis };
    case 'roth401k':
    case 'roth403b':
    case 'rothIra':
      return { ...base, type: account.type, percentBonds: account.percentBonds, contributionBasis: account.contributionBasis };
    case '401k':
    case '403b':
    case 'ira':
    case 'hsa':
      return { ...base, type: account.type, percentBonds: account.percentBonds };
  }
}

/**
 * Transforms Zod ContributionInputs to Convex contribution rule format
 */
export function contributionToConvex(contribution: ContributionInputs): Doc<'plans'>['contributionRules'][number] {
  const base = {
    id: contribution.id,
    accountId: contribution.accountId,
    rank: contribution.rank,
    disabled: contribution.disabled ?? false,
    maxBalance: contribution.maxBalance,
    incomeIds: contribution.incomeIds,
    employerMatch: contribution.employerMatch,
    enableMegaBackdoorRoth: contribution.enableMegaBackdoorRoth,
  };

  switch (contribution.contributionType) {
    case 'dollarAmount':
      return { ...base, amount: { type: 'dollarAmount', dollarAmount: contribution.dollarAmount } };
    case 'percentRemaining':
      return { ...base, amount: { type: 'percentRemaining', percentRemaining: contribution.percentRemaining } };
    case 'unlimited':
      return { ...base, amount: { type: 'unlimited' } };
  }
}

/**
 * Transforms Zod BaseContributionInputs to Convex base contribution rule format
 */
export function baseContributionToConvex(baseContribution: BaseContributionInputs): Doc<'plans'>['baseContributionRule'] {
  return { type: baseContribution.type };
}

/**
 * Transforms Zod TaxSettingsInputs to Convex tax settings format
 */
export function taxSettingsToConvex(taxSettings: TaxSettingsInputs): Doc<'plans'>['taxSettings'] {
  return { filingStatus: taxSettings.filingStatus };
}

/**
 * Transforms Zod PrivacySettingsInputs to Convex privacy settings format
 */
export function privacySettingsToConvex(privacySettings: PrivacySettingsInputs): Doc<'plans'>['privacySettings'] {
  return { isPrivate: privacySettings.isPrivate };
}

/**
 * Transforms Zod SimulationSettingsInputs to Convex simulation settings format
 */
export function simulationSettingsToConvex(simulationSettings: SimulationSettingsInputs): Doc<'plans'>['simulationSettings'] {
  return { ...simulationSettings };
}

/**
 * Transforms Zod ExpenseInputs to Convex expense format
 */
export function expenseToConvex(expense: ExpenseInputs): Doc<'plans'>['expenses'][number] {
  return {
    id: expense.id,
    name: expense.name,
    amount: expense.amount,
    frequency: expense.frequency,
    timeframe: { start: expense.timeframe.start, end: expense.timeframe.end },
    growth: expense.growth,
    disabled: expense.disabled ?? false,
  };
}

/**
 * Transforms Zod DebtInputs to Convex debt format
 */
export function debtToConvex(debt: DebtInputs): NonNullable<Doc<'plans'>['debts']>[number] {
  return {
    id: debt.id,
    name: debt.name,
    balance: debt.balance,
    apr: debt.apr,
    interestType: debt.interestType,
    compoundingFrequency: debt.compoundingFrequency,
    startDate: { ...debt.startDate },
    monthlyPayment: debt.monthlyPayment,
    disabled: debt.disabled ?? false,
  };
}

/**
 * Transforms Zod PhysicalAssetInputs to Convex physical asset format
 */
export function physicalAssetToConvex(physicalAsset: PhysicalAssetInputs): NonNullable<Doc<'plans'>['physicalAssets']>[number] {
  return {
    id: physicalAsset.id,
    name: physicalAsset.name,
    assetType: physicalAsset.assetType,
    purchaseDate: { ...physicalAsset.purchaseDate },
    purchasePrice: physicalAsset.purchasePrice,
    marketValue: physicalAsset.marketValue,
    appreciationRate: physicalAsset.appreciationRate,
    saleDate: physicalAsset.saleDate ? { ...physicalAsset.saleDate } : undefined,
    paymentMethod: physicalAsset.paymentMethod,
  };
}

/**
 * Transforms Zod IncomeInputs to Convex income format
 */
export function incomeToConvex(income: IncomeInputs): Doc<'plans'>['incomes'][number] {
  return {
    id: income.id,
    name: income.name,
    amount: income.amount,
    frequency: income.frequency,
    timeframe: { start: income.timeframe.start, end: income.timeframe.end },
    growth: income.growth,
    taxes: { incomeType: income.taxes.incomeType, withholding: income.taxes.withholding },
    disabled: income.disabled ?? false,
  };
}

/**
 * Transforms Zod MarketAssumptionsInputs to Convex market assumptions format
 */
export function marketAssumptionsToConvex(marketAssumptions: MarketAssumptionsInputs): Doc<'plans'>['marketAssumptions'] {
  return {
    stockReturn: marketAssumptions.stockReturn,
    stockYield: marketAssumptions.stockYield,
    bondReturn: marketAssumptions.bondReturn,
    bondYield: marketAssumptions.bondYield,
    cashReturn: marketAssumptions.cashReturn,
    inflationRate: marketAssumptions.inflationRate,
  };
}

/**
 * Transforms Zod TimelineInputs to Convex timeline format
 */
export function timelineToConvex(timeline: TimelineInputs | null): Doc<'plans'>['timeline'] {
  return timeline ? structuredClone(timeline) : null;
}

/**
 * Transforms Zod SimulatorInputs to partial Convex plan format (without userId and name)
 */
export function simulatorToConvex(
  simulator: SimulatorInputs
): Omit<Doc<'plans'>, '_id' | '_creationTime' | 'userId' | 'name' | 'isDefault'> {
  const incomes = Object.values(simulator.incomes).map(incomeToConvex);
  const accounts = Object.values(simulator.accounts).map(accountToConvex);
  const glidePath = simulator.glidePath ? glidePathToConvex(simulator.glidePath) : undefined;
  const expenses = Object.values(simulator.expenses).map(expenseToConvex);
  const debts = Object.values(simulator.debts).map(debtToConvex);
  const physicalAssets = Object.values(simulator.physicalAssets).map(physicalAssetToConvex);
  const contributionRules = Object.values(simulator.contributionRules).map(contributionToConvex);

  return {
    timeline: timelineToConvex(simulator.timeline),
    incomes,
    accounts,
    glidePath,
    expenses,
    debts,
    physicalAssets,
    contributionRules,
    baseContributionRule: baseContributionToConvex(simulator.baseContributionRule),
    marketAssumptions: marketAssumptionsToConvex(simulator.marketAssumptions),
    taxSettings: taxSettingsToConvex(simulator.taxSettings),
    privacySettings: privacySettingsToConvex(simulator.privacySettings),
    simulationSettings: simulationSettingsToConvex(simulator.simulationSettings),
  };
}

/**
 * Transforms Zod AssetInputs to Convex asset format
 */
export function assetToConvex(asset: AssetInputs): Doc<'finances'>['assets'][number] {
  return { ...asset, url: asset.url === '' ? undefined : asset.url };
}

/**
 * Transforms Zod LiabilityInputs to Convex liability format
 */
export function liabilityToConvex(liability: LiabilityInputs): Doc<'finances'>['liabilities'][number] {
  return { ...liability, url: liability.url === '' ? undefined : liability.url };
}

/**
 * Transforms Zod GlidePathInputs to Convex glide path format
 */
export function glidePathToConvex(glidePath: GlidePathInputs): NonNullable<Doc<'plans'>['glidePath']> {
  return structuredClone(glidePath);
}

// ============================================================================
// SIMULATION RESULT TRANSFORMERS
// ============================================================================

/**
 * Transforms TypeScript SimulationResult to Convex SimulationResult format
 */
export function simulationResultToConvex(simulation: SimulationResult): ConvexSimulationResult {
  const netWorthData = ChartDataExtractor.extractSingleSimulationNetWorthData(simulation).slice(1);
  const cashFlowData = ChartDataExtractor.extractSingleSimulationCashFlowData(simulation);
  const taxesData = ChartDataExtractor.extractSingleSimulationTaxesData(simulation);
  const contributionsData = ChartDataExtractor.extractSingleSimulationContributionsData(simulation);
  const withdrawalsData = ChartDataExtractor.extractSingleSimulationWithdrawalsData(simulation);

  const simulationResult: ConvexSimulationResult['simulationResult'] = [];
  for (let i = 0; i < netWorthData.length; i++) {
    simulationResult.push({
      age: netWorthData[i].age,

      // Net Worth
      stockHoldings: netWorthData[i].stockHoldings,
      bondHoldings: netWorthData[i].bondHoldings,
      cashHoldings: netWorthData[i].cashHoldings,
      taxableValue: netWorthData[i].taxableValue,
      taxDeferredValue: netWorthData[i].taxDeferredValue,
      taxFreeValue: netWorthData[i].taxFreeValue,
      cashSavings: netWorthData[i].cashSavings,
      totalValue: netWorthData[i].stockHoldings + netWorthData[i].bondHoldings + netWorthData[i].cashHoldings,

      // Cash Flow
      earnedIncome: cashFlowData[i].earnedIncome,
      socialSecurityIncome: cashFlowData[i].socialSecurityIncome,
      taxFreeIncome: cashFlowData[i].taxFreeIncome,
      retirementDistributions: taxesData[i].taxableRetirementDistributions,
      interestIncome: taxesData[i].taxableInterestIncome,
      realizedGains: taxesData[i].realizedGains,
      dividendIncome: taxesData[i].taxableDividendIncome,
      taxesAndPenalties: cashFlowData[i].taxesAndPenalties,
      expenses: cashFlowData[i].expenses,
      surplusDeficit: cashFlowData[i].surplusDeficit,
      savingsRate: cashFlowData[i].savingsRate,
      netCashFlow: cashFlowData[i].netCashFlow,

      // Taxes
      grossIncome: taxesData[i].grossIncome,
      adjustedGrossIncome: taxesData[i].adjustedGrossIncome,
      taxableIncome: taxesData[i].taxableIncome,
      ficaTax: taxesData[i].annualFicaTax,
      federalIncomeTax: taxesData[i].annualIncomeTax,
      capitalGainsTax: taxesData[i].annualCapGainsTax,
      niit: taxesData[i].annualNiit,
      earlyWithdrawalPenalties: taxesData[i].annualEarlyWithdrawalPenalties,
      netInvestmentIncome: taxesData[i].netInvestmentIncome,
      incomeSubjectToNiit: taxesData[i].incomeSubjectToNiit,
      effectiveIncomeTaxRate: taxesData[i].effectiveIncomeTaxRate,
      topMarginalIncomeTaxRate: taxesData[i].topMarginalIncomeTaxRate,
      effectiveCapitalGainsTaxRate: taxesData[i].effectiveCapGainsTaxRate,
      topMarginalCapitalGainsTaxRate: taxesData[i].topMarginalCapGainsTaxRate,
      taxDeductibleContributions: taxesData[i].taxDeductibleContributions,
      capitalLossDeduction: taxesData[i].capitalLossDeduction,

      // Contributions
      totalContributions: contributionsData[i].annualContributions,
      taxableContributions: contributionsData[i].taxableContributions,
      taxDeferredContributions: contributionsData[i].taxDeferredContributions,
      taxFreeContributions: contributionsData[i].taxFreeContributions,
      cashContributions: contributionsData[i].cashSavingsContributions,
      employerMatch: contributionsData[i].annualEmployerMatch,

      // Withdrawals
      totalWithdrawals: withdrawalsData[i].annualWithdrawals,
      taxableWithdrawals: withdrawalsData[i].taxableWithdrawals,
      taxDeferredWithdrawals: withdrawalsData[i].taxDeferredWithdrawals,
      taxFreeWithdrawals: withdrawalsData[i].taxFreeWithdrawals,
      cashWithdrawals: withdrawalsData[i].cashSavingsWithdrawals,
      requiredMinimumDistributions: withdrawalsData[i].annualRequiredMinimumDistributions,
      earlyWithdrawals: withdrawalsData[i].annualEarlyWithdrawals,
      rothEarningsWithdrawals: withdrawalsData[i].annualRothEarningsWithdrawals,
      withdrawalRate: withdrawalsData[i].withdrawalRate,

      // Debts
      unsecuredDebtBalance: netWorthData[i].unsecuredDebtBalance,
      securedDebtBalance: netWorthData[i].securedDebtBalance,
      debtPayments: cashFlowData[i].debtPayments,
      debtPaydown: netWorthData[i].annualDebtPaydown,
      debtPayoff: netWorthData[i].annualDebtPayoff,
      debtIncurred: netWorthData[i].annualDebtIncurred,

      // Physical Assets
      assetValue: netWorthData[i].assetValue,
      assetEquity: netWorthData[i].assetEquity,
      assetPurchaseOutlay: cashFlowData[i].assetPurchaseOutlay,
      assetSaleProceeds: cashFlowData[i].assetSaleProceeds,
      assetAppreciation: netWorthData[i].annualAssetAppreciation,
    });
  }

  const incomeTaxBrackets: ConvexSimulationResult['incomeTaxBrackets'] = taxesData[0].incomeTaxBrackets;
  const capitalGainsTaxBrackets: ConvexSimulationResult['capitalGainsTaxBrackets'] = taxesData[0].capitalGainsTaxBrackets;
  const standardDeduction: ConvexSimulationResult['standardDeduction'] = taxesData[0].standardDeduction;
  const niitThreshold: ConvexSimulationResult['niitThreshold'] = taxesData[0].niitThreshold;

  return { simulationResult, incomeTaxBrackets, capitalGainsTaxBrackets, standardDeduction, niitThreshold };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Converts an array of items to a record keyed by ID
 */
export function arrayToRecord<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

/**
 * Converts a record to an array of items
 */
export function recordToArray<T>(record: Record<string, T>): T[] {
  return Object.values(record);
}
