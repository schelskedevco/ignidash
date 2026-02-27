/// <reference types="vite/client" />
// @vitest-environment edge-runtime
import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';
import schema from '../schema';
import { basicTemplate } from '../templates/basic';
import { removeDanglingSyncIds } from './plan_export_utils';

const modules = import.meta.glob('../**/*.ts');

const TEST_USER = 'test-user-123';

type PlanOverrides = Partial<typeof basicTemplate> & { name?: string };

function makePlan(overrides: PlanOverrides = {}) {
  return { name: 'Test Plan', ...basicTemplate, ...overrides };
}

function makeAccount(overrides: Record<string, unknown> = {}) {
  return { id: 'a1', name: 'Savings', balance: 1000, type: 'savings' as const, ...overrides };
}

function makeDebt(overrides: Record<string, unknown> = {}) {
  return {
    id: 'd1',
    name: 'Student Loan',
    balance: 25000,
    apr: 5,
    interestType: 'compound' as const,
    compoundingFrequency: 'monthly' as const,
    startDate: { type: 'now' as const },
    monthlyPayment: 300,
    ...overrides,
  };
}

function makePhysicalAsset(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pa1',
    name: 'House',
    purchaseDate: { type: 'now' as const },
    purchasePrice: 300000,
    marketValue: 350000,
    appreciationRate: 3,
    paymentMethod: { type: 'cash' as const } as
      | { type: 'cash' }
      | { type: 'loan'; loanBalance: number; apr: number; monthlyPayment: number; downPayment?: number },
    ...overrides,
  };
}

describe('removeDanglingSyncIds', () => {
  it('strips all synced IDs when user has no finances document', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const planData = makePlan({
        accounts: [makeAccount({ syncedFinanceId: 'asset-1' })],
        debts: [makeDebt({ syncedFinanceId: 'liability-1' })],
        physicalAssets: [makePhysicalAsset({ syncedAssetId: 'asset-2', syncedLiabilityId: 'liability-2' })],
      });

      const result = await removeDanglingSyncIds(ctx, TEST_USER, planData);

      expect(result.accounts[0].syncedFinanceId).toBeUndefined();
      expect(result.debts![0].syncedFinanceId).toBeUndefined();
      expect(result.physicalAssets![0].syncedAssetId).toBeUndefined();
      expect(result.physicalAssets![0].syncedLiabilityId).toBeUndefined();
    });
  });

  it('strips synced IDs that do not match any finance', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert('finances', {
        userId: TEST_USER,
        assets: [{ id: 'asset-1', name: 'Savings', value: 1000, type: 'savings', updatedAt: Date.now() }],
        liabilities: [{ id: 'liability-1', name: 'Student Loan', balance: 25000, type: 'studentLoan', updatedAt: Date.now() }],
      });

      const planData = makePlan({
        accounts: [makeAccount({ syncedFinanceId: 'nonexistent-asset' })],
        debts: [makeDebt({ syncedFinanceId: 'nonexistent-liability' })],
        physicalAssets: [makePhysicalAsset({ syncedAssetId: 'nonexistent-asset', syncedLiabilityId: 'nonexistent-liability' })],
      });

      const result = await removeDanglingSyncIds(ctx, TEST_USER, planData);

      expect(result.accounts[0].syncedFinanceId).toBeUndefined();
      expect(result.debts![0].syncedFinanceId).toBeUndefined();
      expect(result.physicalAssets![0].syncedAssetId).toBeUndefined();
      expect(result.physicalAssets![0].syncedLiabilityId).toBeUndefined();
    });
  });

  it('preserves synced IDs that match valid asset/liability IDs', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert('finances', {
        userId: TEST_USER,
        assets: [{ id: 'asset-1', name: 'Savings', value: 1000, type: 'savings', updatedAt: Date.now() }],
        liabilities: [{ id: 'liability-1', name: 'Student Loan', balance: 25000, type: 'studentLoan', updatedAt: Date.now() }],
      });

      const planData = makePlan({
        accounts: [makeAccount({ syncedFinanceId: 'asset-1' })],
        debts: [makeDebt({ syncedFinanceId: 'liability-1' })],
        physicalAssets: [makePhysicalAsset({ syncedAssetId: 'asset-1', syncedLiabilityId: 'liability-1' })],
      });

      const result = await removeDanglingSyncIds(ctx, TEST_USER, planData);

      expect(result.accounts[0].syncedFinanceId).toBe('asset-1');
      expect(result.debts![0].syncedFinanceId).toBe('liability-1');
      expect(result.physicalAssets![0].syncedAssetId).toBe('asset-1');
      expect(result.physicalAssets![0].syncedLiabilityId).toBe('liability-1');
    });
  });

  it('strips some IDs and keeps others in the same plan', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert('finances', {
        userId: TEST_USER,
        assets: [{ id: 'asset-1', name: 'Savings', value: 1000, type: 'savings', updatedAt: Date.now() }],
        liabilities: [{ id: 'liability-1', name: 'Student Loan', balance: 25000, type: 'studentLoan', updatedAt: Date.now() }],
      });

      const planData = makePlan({
        accounts: [
          makeAccount({ id: 'a1', syncedFinanceId: 'asset-1' }),
          makeAccount({ id: 'a2', name: 'Checking', syncedFinanceId: 'nonexistent' }),
        ],
        debts: [
          makeDebt({ id: 'd1', syncedFinanceId: 'liability-1' }),
          makeDebt({ id: 'd2', name: 'Car Loan', balance: 10000, syncedFinanceId: 'bad-id' }),
        ],
        physicalAssets: [
          makePhysicalAsset({ id: 'pa1', syncedAssetId: 'asset-1', syncedLiabilityId: 'nonexistent' }),
          makePhysicalAsset({ id: 'pa2', syncedAssetId: 'bad-id', syncedLiabilityId: 'liability-1' }),
        ],
      });

      const result = await removeDanglingSyncIds(ctx, TEST_USER, planData);

      // Valid IDs preserved
      expect(result.accounts[0].syncedFinanceId).toBe('asset-1');
      expect(result.debts![0].syncedFinanceId).toBe('liability-1');
      expect(result.physicalAssets![0].syncedAssetId).toBe('asset-1');
      expect(result.physicalAssets![1].syncedLiabilityId).toBe('liability-1');

      // Invalid IDs stripped
      expect(result.accounts[1].syncedFinanceId).toBeUndefined();
      expect(result.debts![1].syncedFinanceId).toBeUndefined();
      expect(result.physicalAssets![0].syncedLiabilityId).toBeUndefined();
      expect(result.physicalAssets![1].syncedAssetId).toBeUndefined();
    });
  });

  it('preserves all non-synced fields', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const planData = makePlan({
        accounts: [makeAccount({ id: 'a1', type: 'rothIra', balance: 50000, syncedFinanceId: 'x' })],
        debts: [makeDebt({ syncedFinanceId: 'y' })],
        physicalAssets: [makePhysicalAsset({ syncedAssetId: 'z', syncedLiabilityId: 'w' })],
      });

      const result = await removeDanglingSyncIds(ctx, TEST_USER, planData);

      expect(result.accounts[0]).toMatchObject({ id: 'a1', type: 'rothIra', balance: 50000 });
      expect(result.debts![0]).toMatchObject({ name: 'Student Loan', balance: 25000 });
      expect(result.physicalAssets![0]).toMatchObject({ name: 'House', marketValue: 350000 });
    });
  });

  it('leaves items without synced IDs untouched', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const planData = makePlan({
        accounts: [makeAccount(), makeAccount({ id: 'a2', name: 'Checking', syncedFinanceId: 'dangling' })],
        debts: [makeDebt()],
        physicalAssets: [makePhysicalAsset()],
      });

      const result = await removeDanglingSyncIds(ctx, TEST_USER, planData);

      expect(result.accounts[0]).toMatchObject({ id: 'a1', name: 'Savings', balance: 1000 });
      expect(result.accounts[0].syncedFinanceId).toBeUndefined();
      expect(result.accounts[1].syncedFinanceId).toBeUndefined();
      expect(result.debts![0]).toMatchObject({ id: 'd1', name: 'Student Loan' });
      expect(result.physicalAssets![0]).toMatchObject({ id: 'pa1', name: 'House' });
    });
  });

  it('handles undefined debts and physicalAssets', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const planData = makePlan({
        accounts: [makeAccount({ syncedFinanceId: 'dangling' })],
        debts: undefined,
        physicalAssets: undefined,
      });

      const result = await removeDanglingSyncIds(ctx, TEST_USER, planData);

      expect(result.accounts[0].syncedFinanceId).toBeUndefined();
      expect(result.debts).toBeUndefined();
      expect(result.physicalAssets).toBeUndefined();
    });
  });
});
