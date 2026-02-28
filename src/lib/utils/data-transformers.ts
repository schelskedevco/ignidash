/**
 * Two-way mapping between Convex documents (DB layer) and Zod-validated types (app layer).
 *
 * Convex stores plan data as flat arrays with optional fields shared across discriminated unions.
 * Zod schemas use stricter discriminated unions and id-keyed records. These transformers bridge
 * the two representations so the rest of the app only works with Zod types.
 *
 * Naming convention:
 *   - `xFromConvex` — Convex Doc → Zod input type
 *   - `xToConvex`   — Zod input type → Convex Doc
 */

import type { Doc } from '@/convex/_generated/dataModel';
import type { SimulationResult as ConvexSimulationResult } from '@/convex/validators/simulation_result_validator';

import { ChartDataExtractor } from '@/lib/calc/data-extractors/chart-data-extractor';
import type { PhaseName } from '@/lib/calc/phase';
import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import type { ContributionInputs, BaseContributionInputs } from '@/lib/schemas/inputs/contribution-form-schema';
import type { IncomeInputs } from '@/lib/schemas/inputs/income-form-schema';
import type { ExpenseInputs } from '@/lib/schemas/inputs/expense-form-schema';
import type { DebtInputs } from '@/lib/schemas/inputs/debt-form-schema';
import type { PhysicalAssetInputs } from '@/lib/schemas/inputs/physical-asset-form-schema';
import type { MarketAssumptionsInputs } from '@/lib/schemas/inputs/market-assumptions-form-schema';
import type { TimelineInputs } from '@/lib/schemas/inputs/timeline-form-schema';
import type { TaxSettingsInputs } from '@/lib/schemas/inputs/tax-settings-form-schema';
import type { PrivacySettingsInputs } from '@/lib/schemas/inputs/privacy-settings-form-schema';
import type { SimulationSettingsInputs } from '@/lib/schemas/inputs/simulation-settings-form-schema';
import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';
import type { AssetInputs } from '@/lib/schemas/finances/asset-form-schema';
import type { LiabilityInputs } from '@/lib/schemas/finances/liability-form-schema';
import type { GlidePathInputs } from '@/lib/schemas/inputs/glide-path-form-schema';
import type { SimulationResult } from '@/lib/calc/simulation-engine';

// ============================================================================
// CONVEX → ZOD
// ============================================================================

// percentBonds is optional in Convex (not applicable to savings), but guaranteed by the
// Zod discriminated union for investment account types — hence the non-null assertions.
export function accountFromConvex(account: Doc<'plans'>['accounts'][number]): AccountInputs {
  const base = { id: account.id, name: account.name, balance: account.balance, syncedFinanceId: account.syncedFinanceId };

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

// Flattens nested amount union ({ type, dollarAmount }) into top-level fields (contributionType, dollarAmount).
export function contributionFromConvex(contribution: Doc<'plans'>['contributionRules'][number]): ContributionInputs {
  const base = {
    id: contribution.id,
    accountId: contribution.accountId,
    rank: contribution.rank,
    maxBalance: contribution.maxBalance,
    incomeId: contribution.incomeId,
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

export function baseContributionFromConvex(baseContribution: Doc<'plans'>['baseContributionRule']): BaseContributionInputs {
  return { type: baseContribution.type };
}

export function taxSettingsFromConvex(taxSettings: Doc<'plans'>['taxSettings']): TaxSettingsInputs {
  return { filingStatus: taxSettings.filingStatus };
}

export function privacySettingsFromConvex(privacySettings: Doc<'plans'>['privacySettings']): PrivacySettingsInputs {
  return { isPrivate: privacySettings.isPrivate };
}

export function simulationSettingsFromConvex(simulationSettings: Doc<'plans'>['simulationSettings']): SimulationSettingsInputs {
  return { ...simulationSettings };
}

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
    syncedFinanceId: debt.syncedFinanceId,
  };
}

// Defaults: assetType → 'other', missing saleDate → 'atLifeExpectancy' (never sold).
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
    syncedAssetId: physicalAsset.syncedAssetId,
    syncedLiabilityId: physicalAsset.syncedLiabilityId,
  };
}

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

// structuredClone to deep-copy nested TimePoint objects and avoid shared references with the Convex doc.
export function timelineFromConvex(timeline: Doc<'plans'>['timeline']): TimelineInputs | null {
  return timeline ? structuredClone(timeline) : null;
}

// Converts the full plan: arrays → id-keyed records, Convex unions → Zod discriminated unions.
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

export function assetFromConvex(asset: Doc<'finances'>['assets'][number]): AssetInputs {
  return { ...asset };
}

export function liabilityFromConvex(liability: Doc<'finances'>['liabilities'][number]): LiabilityInputs {
  return { ...liability };
}

export function glidePathFromConvex(glidePath: Doc<'plans'>['glidePath']): GlidePathInputs | undefined {
  return glidePath ? structuredClone(glidePath) : undefined;
}

// ============================================================================
// ZOD → CONVEX
// ============================================================================

export function accountToConvex(account: AccountInputs): Doc<'plans'>['accounts'][number] {
  const base = { id: account.id, name: account.name, balance: account.balance, syncedFinanceId: account.syncedFinanceId };

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

// Re-nests flat contributionType/dollarAmount back into the amount union.
export function contributionToConvex(contribution: ContributionInputs): Doc<'plans'>['contributionRules'][number] {
  const base = {
    id: contribution.id,
    accountId: contribution.accountId,
    rank: contribution.rank,
    disabled: contribution.disabled ?? false,
    maxBalance: contribution.maxBalance,
    incomeId: contribution.incomeId,
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

export function baseContributionToConvex(baseContribution: BaseContributionInputs): Doc<'plans'>['baseContributionRule'] {
  return { type: baseContribution.type };
}

export function taxSettingsToConvex(taxSettings: TaxSettingsInputs): Doc<'plans'>['taxSettings'] {
  return { filingStatus: taxSettings.filingStatus };
}

export function privacySettingsToConvex(privacySettings: PrivacySettingsInputs): Doc<'plans'>['privacySettings'] {
  return { isPrivate: privacySettings.isPrivate };
}

export function simulationSettingsToConvex(simulationSettings: SimulationSettingsInputs): Doc<'plans'>['simulationSettings'] {
  return { ...simulationSettings };
}

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
    syncedFinanceId: debt.syncedFinanceId,
  };
}

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
    syncedAssetId: physicalAsset.syncedAssetId,
    syncedLiabilityId: physicalAsset.syncedLiabilityId,
  };
}

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

export function timelineToConvex(timeline: TimelineInputs | null): Doc<'plans'>['timeline'] {
  return timeline ? structuredClone(timeline) : null;
}

// Inverse of simulatorFromConvex: id-keyed records → arrays, excludes DB metadata (userId, name, etc.).
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

// Coerces empty-string URLs to undefined so Convex doesn't store "".
export function assetToConvex(asset: AssetInputs): Doc<'finances'>['assets'][number] {
  return { ...asset, url: asset.url === '' ? undefined : asset.url };
}

export function liabilityToConvex(liability: LiabilityInputs): Doc<'finances'>['liabilities'][number] {
  return { ...liability, url: liability.url === '' ? undefined : liability.url };
}

export function glidePathToConvex(glidePath: GlidePathInputs): NonNullable<Doc<'plans'>['glidePath']> {
  return structuredClone(glidePath);
}

// ============================================================================
// SIMULATION RESULT → CONVEX
// ============================================================================

// Flattens multiple chart data extractors (net worth, cash flow, taxes, contributions,
// withdrawals, returns) into a single flat row per year for LLM API consumption.
// Skips the first net worth data point (initial state before year 1).
export function simulationResultToConvex(simulation: SimulationResult): ConvexSimulationResult {
  const netWorthData = ChartDataExtractor.extractSingleSimulationNetWorthData(simulation).slice(1);
  const cashFlowData = ChartDataExtractor.extractSingleSimulationCashFlowData(simulation);
  const taxesData = ChartDataExtractor.extractSingleSimulationTaxesData(simulation);
  const contributionsData = ChartDataExtractor.extractSingleSimulationContributionsData(simulation);
  const withdrawalsData = ChartDataExtractor.extractSingleSimulationWithdrawalsData(simulation);
  const returnsData = ChartDataExtractor.extractSingleSimulationReturnsData(simulation);

  const phaseLabels = { accumulation: 'accum', retirement: 'retire' } as const;
  const toPhaseLabel = (name: PhaseName | undefined): 'accum' | 'retire' | null => (name ? phaseLabels[name] : null);

  const simulationResult: ConvexSimulationResult['simulationResult'] = [];
  for (let i = 0; i < netWorthData.length; i++) {
    const phase = simulation.data[i + 1]?.phase;

    simulationResult.push({
      age: netWorthData[i].age,
      phaseName: toPhaseLabel(phase?.name),

      // Net Worth
      netWorth: netWorthData[i].netWorth,
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
      federalIncomeTax: taxesData[i].annualFederalIncomeTax,
      capitalGainsTax: taxesData[i].annualCapitalGainsTax,
      niit: taxesData[i].annualNiit,
      earlyWithdrawalPenalties: taxesData[i].annualEarlyWithdrawalPenalties,
      netInvestmentIncome: taxesData[i].netInvestmentIncome,
      effectiveFederalIncomeTaxRate: taxesData[i].effectiveFederalIncomeTaxRate,
      topMarginalFederalIncomeTaxRate: taxesData[i].topMarginalFederalIncomeTaxRate,
      effectiveCapitalGainsTaxRate: taxesData[i].effectiveCapitalGainsTaxRate,
      topMarginalCapitalGainsTaxRate: taxesData[i].topMarginalCapitalGainsTaxRate,
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

      // Returns
      realStockReturnRate: returnsData[i].realStockReturnRate,
      realBondReturnRate: returnsData[i].realBondReturnRate,
      realCashReturnRate: returnsData[i].realCashReturnRate,
      inflationRate: returnsData[i].inflationRate,
      annualStockGain: returnsData[i].annualStockGain,
      annualBondGain: returnsData[i].annualBondGain,
      annualCashGain: returnsData[i].annualCashGain,
      totalAnnualGains: returnsData[i].totalAnnualGains,
    });
  }

  const federalIncomeTaxBrackets: ConvexSimulationResult['federalIncomeTaxBrackets'] = taxesData[0].federalIncomeTaxBrackets;
  const capitalGainsTaxBrackets: ConvexSimulationResult['capitalGainsTaxBrackets'] = taxesData[0].capitalGainsTaxBrackets;
  const standardDeduction: ConvexSimulationResult['standardDeduction'] = taxesData[0].standardDeduction;
  const niitThreshold: ConvexSimulationResult['niitThreshold'] = taxesData[0].niitThreshold;

  return { simulationResult, federalIncomeTaxBrackets, capitalGainsTaxBrackets, standardDeduction, niitThreshold };
}

// ============================================================================
// HELPERS
// ============================================================================

export function arrayToRecord<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

export function recordToArray<T>(record: Record<string, T>): T[] {
  return Object.values(record);
}
