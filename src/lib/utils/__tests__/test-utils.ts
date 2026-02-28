/**
 * Shared Test Factories for Utils Tests
 *
 * Provides factory functions that create Convex document shapes matching the DB layer.
 * Used primarily by data-transformers tests to verify bidirectional Convex↔Zod transforms.
 */

import type { Doc } from '@/convex/_generated/dataModel';

type ConvexAccount = Doc<'plans'>['accounts'][number];
type ConvexIncome = Doc<'plans'>['incomes'][number];
type ConvexExpense = Doc<'plans'>['expenses'][number];
type ConvexDebt = NonNullable<Doc<'plans'>['debts']>[number];
type ConvexContribution = Doc<'plans'>['contributionRules'][number];
type ConvexPhysicalAsset = NonNullable<Doc<'plans'>['physicalAssets']>[number];

// ============================================================================
// Convex Document Factories
// ============================================================================

export const createConvexAccount = (overrides?: Partial<ConvexAccount> & { type?: ConvexAccount['type'] }): ConvexAccount => {
  const type = overrides?.type ?? 'savings';
  const base = {
    id: overrides?.id ?? 'acct-1',
    name: overrides?.name ?? 'Test Account',
    balance: overrides?.balance ?? 50000,
    syncedFinanceId: overrides?.syncedFinanceId,
  };

  switch (type) {
    case 'savings':
      return { ...base, type: 'savings' };
    case 'taxableBrokerage':
      return { ...base, type: 'taxableBrokerage', percentBonds: overrides?.percentBonds ?? 20, costBasis: overrides?.costBasis ?? 30000 };
    case 'roth401k':
    case 'roth403b':
    case 'rothIra':
      return { ...base, type, percentBonds: overrides?.percentBonds ?? 20, contributionBasis: overrides?.contributionBasis ?? 25000 };
    case '401k':
    case '403b':
    case 'ira':
    case 'hsa':
      return { ...base, type, percentBonds: overrides?.percentBonds ?? 20 };
  }
};

export const createConvexIncome = (overrides?: Partial<ConvexIncome>): ConvexIncome => ({
  id: overrides?.id ?? 'inc-1',
  name: overrides?.name ?? 'Salary',
  amount: overrides?.amount ?? 100000,
  frequency: overrides?.frequency ?? 'yearly',
  timeframe: overrides?.timeframe ?? { start: { type: 'now' }, end: { type: 'atRetirement' } },
  growth: overrides?.growth,
  taxes: overrides?.taxes ?? { incomeType: 'wage', withholding: 22 },
  disabled: overrides?.disabled ?? false,
});

export const createConvexExpense = (overrides?: Partial<ConvexExpense>): ConvexExpense => ({
  id: overrides?.id ?? 'exp-1',
  name: overrides?.name ?? 'Living Expenses',
  amount: overrides?.amount ?? 40000,
  frequency: overrides?.frequency ?? 'yearly',
  timeframe: overrides?.timeframe ?? { start: { type: 'now' }, end: { type: 'atLifeExpectancy' } },
  growth: overrides?.growth,
  disabled: overrides?.disabled ?? false,
});

export const createConvexDebt = (overrides?: Partial<ConvexDebt>): ConvexDebt => ({
  id: overrides?.id ?? 'debt-1',
  name: overrides?.name ?? 'Credit Card',
  balance: overrides?.balance ?? 10000,
  apr: overrides?.apr ?? 18,
  interestType: overrides?.interestType ?? 'simple',
  compoundingFrequency: overrides?.compoundingFrequency,
  startDate: overrides?.startDate ?? { type: 'now' },
  monthlyPayment: overrides?.monthlyPayment ?? 500,
  disabled: overrides?.disabled,
  syncedFinanceId: overrides?.syncedFinanceId,
});

export const createConvexContribution = (
  overrides?: Partial<Omit<ConvexContribution, 'amount'>> & {
    amount?: ConvexContribution['amount'];
  }
): ConvexContribution => ({
  id: overrides?.id ?? 'contrib-1',
  accountId: overrides?.accountId ?? 'acct-1',
  rank: overrides?.rank ?? 1,
  maxBalance: overrides?.maxBalance,
  incomeId: overrides?.incomeId,
  disabled: overrides?.disabled ?? false,
  employerMatch: overrides?.employerMatch,
  enableMegaBackdoorRoth: overrides?.enableMegaBackdoorRoth,
  amount: overrides?.amount ?? { type: 'unlimited' },
});

export const createConvexPhysicalAsset = (overrides?: Partial<ConvexPhysicalAsset>): ConvexPhysicalAsset => ({
  id: overrides?.id ?? 'asset-1',
  name: overrides?.name ?? 'Primary Residence',
  assetType: overrides?.assetType,
  purchaseDate: overrides?.purchaseDate ?? { type: 'now' },
  purchasePrice: overrides?.purchasePrice ?? 400000,
  marketValue: overrides?.marketValue,
  appreciationRate: overrides?.appreciationRate ?? 3,
  saleDate: overrides?.saleDate,
  paymentMethod: overrides?.paymentMethod ?? { type: 'cash' },
  syncedAssetId: overrides?.syncedAssetId,
  syncedLiabilityId: overrides?.syncedLiabilityId,
});
