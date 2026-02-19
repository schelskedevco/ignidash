/// <reference types="vite/client" />
// @vitest-environment edge-runtime
import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';
import schema from '../schema';
import { basicTemplate } from '../templates/basic';
import {
  syncAssetToPlans,
  unsyncAssetFromPlans,
  syncLiabilityToPlans,
  unsyncLiabilityFromPlans,
  unsyncAllAssetsFromPlans,
  unsyncAllLiabilitiesFromPlans,
} from './finance_sync_utils';

const modules = import.meta.glob('../**/*.ts');

const TEST_USER = 'test-user-123';

type PlanOverrides = Partial<typeof basicTemplate> & { name?: string };

function makePlan(overrides: PlanOverrides = {}) {
  return { ...basicTemplate, userId: TEST_USER, name: 'Test Plan', ...overrides };
}

function makeDebt(overrides: Record<string, unknown> = {}) {
  return {
    id: 'debt-1',
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
    id: 'pa-1',
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

// --- syncAssetToPlans ---

describe('syncAssetToPlans', () => {
  it('syncs balance and name to a linked account', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const planId = await ctx.db.insert(
        'plans',
        makePlan({
          accounts: [{ id: 'acc-1', name: 'Old Name', type: 'savings', balance: 100, syncedFinanceId: 'asset-1' }],
        })
      );

      await syncAssetToPlans(ctx, TEST_USER, {
        id: 'asset-1',
        name: 'Updated Name',
        value: 200,
        type: 'savings',
        updatedAt: Date.now(),
      });

      const plan = await ctx.db.get(planId);
      expect(plan!.accounts[0].balance).toBe(200);
      expect(plan!.accounts[0].name).toBe('Updated Name');
      expect(plan!.accounts[0].syncedFinanceId).toBe('asset-1');
    });
  });

  it('syncs marketValue and name to a linked physical asset', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const planId = await ctx.db.insert(
        'plans',
        makePlan({
          physicalAssets: [makePhysicalAsset({ syncedAssetId: 'asset-1', marketValue: 100 })],
        })
      );

      await syncAssetToPlans(ctx, TEST_USER, {
        id: 'asset-1',
        name: 'Updated House',
        value: 500000,
        type: 'realEstate',
        updatedAt: Date.now(),
      });

      const plan = await ctx.db.get(planId);
      expect(plan!.physicalAssets![0].marketValue).toBe(500000);
      expect(plan!.physicalAssets![0].name).toBe('Updated House');
    });
  });

  it('does not modify unlinked items', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const planId = await ctx.db.insert(
        'plans',
        makePlan({
          accounts: [{ id: 'acc-1', name: 'My Savings', type: 'savings', balance: 5000 }],
        })
      );

      await syncAssetToPlans(ctx, TEST_USER, {
        id: 'asset-99',
        name: 'Irrelevant',
        value: 999,
        type: 'savings',
        updatedAt: Date.now(),
      });

      const plan = await ctx.db.get(planId);
      expect(plan!.accounts[0].balance).toBe(5000);
      expect(plan!.accounts[0].name).toBe('My Savings');
    });
  });

  it('propagates across multiple plans', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const plan1Id = await ctx.db.insert(
        'plans',
        makePlan({
          name: 'Plan 1',
          accounts: [{ id: 'acc-1', name: 'Old', type: 'savings', balance: 100, syncedFinanceId: 'asset-1' }],
        })
      );
      const plan2Id = await ctx.db.insert(
        'plans',
        makePlan({
          name: 'Plan 2',
          accounts: [{ id: 'acc-2', name: 'Old', type: '401k', balance: 200, syncedFinanceId: 'asset-1' }],
        })
      );

      await syncAssetToPlans(ctx, TEST_USER, {
        id: 'asset-1',
        name: 'New',
        value: 999,
        type: 'savings',
        updatedAt: Date.now(),
      });

      const plan1 = await ctx.db.get(plan1Id);
      const plan2 = await ctx.db.get(plan2Id);
      expect(plan1!.accounts[0].balance).toBe(999);
      expect(plan2!.accounts[0].balance).toBe(999);
    });
  });

  it('no-ops when no items match', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const planId = await ctx.db.insert(
        'plans',
        makePlan({
          accounts: [{ id: 'acc-1', name: 'Untouched', type: 'savings', balance: 100 }],
        })
      );

      await syncAssetToPlans(ctx, TEST_USER, {
        id: 'asset-no-match',
        name: 'No Match',
        value: 9999,
        type: 'savings',
        updatedAt: Date.now(),
      });

      const plan = await ctx.db.get(planId);
      expect(plan!.accounts[0].balance).toBe(100);
      expect(plan!.accounts[0].name).toBe('Untouched');
    });
  });
});

// --- unsyncAssetFromPlans ---

describe('unsyncAssetFromPlans', () => {
  it('removes syncedFinanceId from accounts but keeps the account', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const planId = await ctx.db.insert(
        'plans',
        makePlan({
          accounts: [{ id: 'acc-1', name: 'Savings', type: 'savings', balance: 5000, syncedFinanceId: 'asset-1' }],
        })
      );

      await unsyncAssetFromPlans(ctx, TEST_USER, 'asset-1');

      const plan = await ctx.db.get(planId);
      expect(plan!.accounts[0].balance).toBe(5000);
      expect(plan!.accounts[0].name).toBe('Savings');
      expect(plan!.accounts[0].syncedFinanceId).toBeUndefined();
    });
  });

  it('removes syncedAssetId from physical assets but keeps them', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const planId = await ctx.db.insert(
        'plans',
        makePlan({
          physicalAssets: [makePhysicalAsset({ syncedAssetId: 'asset-1', marketValue: 350000 })],
        })
      );

      await unsyncAssetFromPlans(ctx, TEST_USER, 'asset-1');

      const plan = await ctx.db.get(planId);
      expect(plan!.physicalAssets![0].marketValue).toBe(350000);
      expect(plan!.physicalAssets![0].name).toBe('House');
      expect(plan!.physicalAssets![0].syncedAssetId).toBeUndefined();
    });
  });

  it('does not affect unlinked items', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const planId = await ctx.db.insert(
        'plans',
        makePlan({
          accounts: [
            { id: 'acc-1', name: 'Linked', type: 'savings', balance: 100, syncedFinanceId: 'asset-1' },
            { id: 'acc-2', name: 'Unlinked', type: '401k', balance: 200, percentBonds: 25 },
          ],
        })
      );

      await unsyncAssetFromPlans(ctx, TEST_USER, 'asset-1');

      const plan = await ctx.db.get(planId);
      expect(plan!.accounts[0].syncedFinanceId).toBeUndefined();
      expect(plan!.accounts[1].name).toBe('Unlinked');
      expect(plan!.accounts[1].balance).toBe(200);
    });
  });
});

// --- syncLiabilityToPlans ---

describe('syncLiabilityToPlans', () => {
  it('syncs balance and name to a linked debt', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const planId = await ctx.db.insert(
        'plans',
        makePlan({
          debts: [makeDebt({ syncedFinanceId: 'liability-1' })],
        })
      );

      await syncLiabilityToPlans(ctx, TEST_USER, {
        id: 'liability-1',
        name: 'Updated Loan',
        balance: 15000,
        type: 'studentLoan',
        updatedAt: Date.now(),
      });

      const plan = await ctx.db.get(planId);
      expect(plan!.debts![0].balance).toBe(15000);
      expect(plan!.debts![0].name).toBe('Updated Loan');
      expect(plan!.debts![0].syncedFinanceId).toBe('liability-1');
    });
  });

  it('syncs loanBalance to a linked physical asset loan', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const planId = await ctx.db.insert(
        'plans',
        makePlan({
          physicalAssets: [
            makePhysicalAsset({
              syncedLiabilityId: 'liability-1',
              paymentMethod: { type: 'loan', loanBalance: 250000, apr: 6.5, monthlyPayment: 1500 },
            }),
          ],
        })
      );

      await syncLiabilityToPlans(ctx, TEST_USER, {
        id: 'liability-1',
        name: 'Mortgage',
        balance: 240000,
        type: 'mortgage',
        updatedAt: Date.now(),
      });

      const plan = await ctx.db.get(planId);
      const pm = plan!.physicalAssets![0].paymentMethod;
      expect(pm.type).toBe('loan');
      if (pm.type === 'loan') {
        expect(pm.loanBalance).toBe(240000);
      }
    });
  });

  it('does not sync to physical assets with cash payment', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const planId = await ctx.db.insert(
        'plans',
        makePlan({
          physicalAssets: [
            makePhysicalAsset({
              syncedLiabilityId: 'liability-1',
              paymentMethod: { type: 'cash' },
            }),
          ],
        })
      );

      await syncLiabilityToPlans(ctx, TEST_USER, {
        id: 'liability-1',
        name: 'Mortgage',
        balance: 240000,
        type: 'mortgage',
        updatedAt: Date.now(),
      });

      const plan = await ctx.db.get(planId);
      expect(plan!.physicalAssets![0].paymentMethod.type).toBe('cash');
    });
  });

  it('handles plans with no debts or physicalAssets', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert('plans', makePlan({ debts: undefined, physicalAssets: undefined }));

      // Should not throw
      await syncLiabilityToPlans(ctx, TEST_USER, {
        id: 'liability-1',
        name: 'Loan',
        balance: 10000,
        type: 'personalLoan',
        updatedAt: Date.now(),
      });
    });
  });
});

// --- unsyncLiabilityFromPlans ---

describe('unsyncLiabilityFromPlans', () => {
  it('removes syncedFinanceId from debts but keeps them', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const planId = await ctx.db.insert(
        'plans',
        makePlan({
          debts: [makeDebt({ syncedFinanceId: 'liability-1' })],
        })
      );

      await unsyncLiabilityFromPlans(ctx, TEST_USER, 'liability-1');

      const plan = await ctx.db.get(planId);
      expect(plan!.debts![0].balance).toBe(25000);
      expect(plan!.debts![0].name).toBe('Student Loan');
      expect(plan!.debts![0].syncedFinanceId).toBeUndefined();
    });
  });

  it('removes syncedLiabilityId from physical assets but keeps them', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const planId = await ctx.db.insert(
        'plans',
        makePlan({
          physicalAssets: [
            makePhysicalAsset({
              syncedLiabilityId: 'liability-1',
              paymentMethod: { type: 'loan', loanBalance: 250000, apr: 6.5, monthlyPayment: 1500 },
            }),
          ],
        })
      );

      await unsyncLiabilityFromPlans(ctx, TEST_USER, 'liability-1');

      const plan = await ctx.db.get(planId);
      const pa = plan!.physicalAssets![0];
      expect(pa.name).toBe('House');
      expect(pa.syncedLiabilityId).toBeUndefined();
      if (pa.paymentMethod.type === 'loan') {
        expect(pa.paymentMethod.loanBalance).toBe(250000);
      }
    });
  });
});

// --- unsyncAllAssetsFromPlans ---

describe('unsyncAllAssetsFromPlans', () => {
  it('strips syncedFinanceId from all accounts', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const planId = await ctx.db.insert(
        'plans',
        makePlan({
          accounts: [
            { id: 'acc-1', name: 'Synced', type: 'savings', balance: 100, syncedFinanceId: 'a-1' },
            { id: 'acc-2', name: 'Not Synced', type: '401k', balance: 200, percentBonds: 25 },
            { id: 'acc-3', name: 'Also Synced', type: 'rothIra', balance: 300, syncedFinanceId: 'a-2' },
          ],
        })
      );

      await unsyncAllAssetsFromPlans(ctx, TEST_USER);

      const plan = await ctx.db.get(planId);
      expect(plan!.accounts[0].syncedFinanceId).toBeUndefined();
      expect(plan!.accounts[1].name).toBe('Not Synced');
      expect(plan!.accounts[2].syncedFinanceId).toBeUndefined();
    });
  });

  it('strips syncedAssetId from all physical assets', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const planId = await ctx.db.insert(
        'plans',
        makePlan({
          physicalAssets: [
            makePhysicalAsset({ id: 'pa-1', syncedAssetId: 'a-1' }),
            makePhysicalAsset({ id: 'pa-2', syncedAssetId: 'a-2' }),
          ],
        })
      );

      await unsyncAllAssetsFromPlans(ctx, TEST_USER);

      const plan = await ctx.db.get(planId);
      expect(plan!.physicalAssets![0].syncedAssetId).toBeUndefined();
      expect(plan!.physicalAssets![1].syncedAssetId).toBeUndefined();
    });
  });

  it('handles plan with no physical assets', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert('plans', makePlan({ physicalAssets: undefined }));

      // Should not throw
      await unsyncAllAssetsFromPlans(ctx, TEST_USER);
    });
  });
});

// --- unsyncAllLiabilitiesFromPlans ---

describe('unsyncAllLiabilitiesFromPlans', () => {
  it('strips syncedFinanceId from all debts', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const planId = await ctx.db.insert(
        'plans',
        makePlan({
          debts: [
            makeDebt({ id: 'debt-1', syncedFinanceId: 'l-1' }),
            makeDebt({ id: 'debt-2', name: 'Car Loan', balance: 10000, syncedFinanceId: 'l-2' }),
          ],
        })
      );

      await unsyncAllLiabilitiesFromPlans(ctx, TEST_USER);

      const plan = await ctx.db.get(planId);
      expect(plan!.debts![0].syncedFinanceId).toBeUndefined();
      expect(plan!.debts![1].syncedFinanceId).toBeUndefined();
    });
  });

  it('strips syncedLiabilityId from all physical assets', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const planId = await ctx.db.insert(
        'plans',
        makePlan({
          physicalAssets: [
            makePhysicalAsset({
              id: 'pa-1',
              syncedLiabilityId: 'l-1',
              paymentMethod: { type: 'loan', loanBalance: 200000, apr: 6, monthlyPayment: 1200 },
            }),
            makePhysicalAsset({
              id: 'pa-2',
              syncedLiabilityId: 'l-2',
              paymentMethod: { type: 'loan', loanBalance: 15000, apr: 4, monthlyPayment: 300 },
            }),
          ],
        })
      );

      await unsyncAllLiabilitiesFromPlans(ctx, TEST_USER);

      const plan = await ctx.db.get(planId);
      expect(plan!.physicalAssets![0].syncedLiabilityId).toBeUndefined();
      expect(plan!.physicalAssets![1].syncedLiabilityId).toBeUndefined();
    });
  });

  it('handles plan with no debts or physical assets', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert('plans', makePlan({ debts: undefined, physicalAssets: undefined }));

      // Should not throw
      await unsyncAllLiabilitiesFromPlans(ctx, TEST_USER);
    });
  });
});
