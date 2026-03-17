/// <reference types="vite/client" />
// @vitest-environment edge-runtime
import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';
import { api } from './_generated/api';
import schema from './schema';
import { basicTemplate } from './templates/basic';

const modules = import.meta.glob('./**/*.ts');

const TEST_USER = 'test-user-123';

type PlanOverrides = Partial<typeof basicTemplate> & { name?: string };

function makePlan(overrides: PlanOverrides = {}) {
  return { ...basicTemplate, userId: TEST_USER, name: 'Test Plan', ...overrides };
}

// --- getCountOfSnapshots ---

describe('getCountOfSnapshots', () => {
  it('returns 0 for a plan with no snapshots', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    const count = await asUser.query(api.plan_snapshots.getCountOfSnapshots, { planId });
    expect(count).toBe(0);
  });

  it('returns correct count after mutations create snapshots', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });

    // First mutation creates 1 snapshot
    await asUser.mutation(api.income.upsertIncome, {
      planId,
      income: { ...basicTemplate.incomes[0], name: 'step-1' },
    });
    expect(await asUser.query(api.plan_snapshots.getCountOfSnapshots, { planId })).toBe(1);

    // Second mutation creates another snapshot
    await asUser.mutation(api.income.upsertIncome, {
      planId,
      income: { ...basicTemplate.incomes[0], name: 'step-2' },
    });
    expect(await asUser.query(api.plan_snapshots.getCountOfSnapshots, { planId })).toBe(2);
  });
});

// --- snapshot creation via mutations ---

describe('snapshot creation via mutations', () => {
  it('creates a snapshot when upserting an account', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.account.upsertAccount, {
      planId,
      account: { id: 'account-1', name: 'updated 401k', balance: 99999, type: '401k' },
    });

    const count = await asUser.query(api.plan_snapshots.getCountOfSnapshots, { planId });
    expect(count).toBe(1);

    // Verify snapshot contains ORIGINAL account data (pre-mutation)
    await t.run(async (ctx) => {
      const snapshots = await ctx.db
        .query('planSnapshots')
        .withIndex('by_planId', (q) => q.eq('planId', planId))
        .collect();
      expect(snapshots).toHaveLength(1);
      const snapshotAccount = snapshots[0].accounts.find((a) => a.id === 'account-1');
      expect(snapshotAccount!.name).toBe('fidelity 401k');
      expect(snapshotAccount!.balance).toBe(60000);
    });
  });

  it('creates a snapshot when deleting an income', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.income.deleteIncome, { planId, incomeId: 'income-1' });

    // Snapshot should have original 2 incomes
    await t.run(async (ctx) => {
      const snapshots = await ctx.db
        .query('planSnapshots')
        .withIndex('by_planId', (q) => q.eq('planId', planId))
        .collect();
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].incomes).toHaveLength(2);
    });
  });
});

// --- max snapshots pruning ---

describe('max snapshots pruning', () => {
  it('keeps at most 10 snapshots per plan', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });

    // Perform 12 mutations
    for (let i = 0; i < 12; i++) {
      await asUser.mutation(api.income.upsertIncome, {
        planId,
        income: { ...basicTemplate.incomes[0], name: `iteration-${i}` },
      });
    }

    const count = await asUser.query(api.plan_snapshots.getCountOfSnapshots, { planId });
    expect(count).toBe(10);
  });

  it('deletes the oldest snapshots when exceeding 10', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });

    // Perform 11 mutations - the first snapshot (original state) should be pruned
    for (let i = 0; i < 11; i++) {
      await asUser.mutation(api.income.upsertIncome, {
        planId,
        income: { ...basicTemplate.incomes[0], name: `iteration-${i}` },
      });
    }

    // The oldest snapshot should have been pruned. The oldest remaining snapshot
    // should contain iteration-0 data (snapshot taken before iteration-1 mutation).
    await t.run(async (ctx) => {
      const snapshots = await ctx.db
        .query('planSnapshots')
        .withIndex('by_planId', (q) => q.eq('planId', planId))
        .order('asc')
        .collect();
      expect(snapshots).toHaveLength(10);
      // Oldest remaining snapshot was taken before mutation iteration-1,
      // so it has the income name from iteration-0
      expect(snapshots[0].incomes.find((i) => i.id === 'income-1')!.name).toBe('iteration-0');
    });
  });
});

// --- undo ---

describe('undo', () => {
  it('restores plan data to pre-mutation state', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });

    // Mutate income name and amount
    await asUser.mutation(api.income.upsertIncome, {
      planId,
      income: { ...basicTemplate.incomes[0], name: 'changed', amount: 999999 },
    });

    // Undo
    await asUser.mutation(api.plan_snapshots.undo, { planId });

    // Verify original values restored
    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      const income = plan!.incomes.find((i) => i.id === 'income-1');
      expect(income!.name).toBe('software engineer salary');
      expect(income!.amount).toBe(87500);
    });
  });

  it('restores all plan fields, not just the changed one', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });

    // Mutate just one field
    await asUser.mutation(api.income.upsertIncome, {
      planId,
      income: { ...basicTemplate.incomes[0], name: 'changed' },
    });

    // Undo
    await asUser.mutation(api.plan_snapshots.undo, { planId });

    // ALL snapshotted fields should match original
    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.incomes).toEqual(basicTemplate.incomes);
      expect(plan!.expenses).toEqual(basicTemplate.expenses);
      expect(plan!.accounts).toEqual(basicTemplate.accounts);
      expect(plan!.contributionRules).toEqual(basicTemplate.contributionRules);
      expect(plan!.timeline).toEqual(basicTemplate.timeline);
      expect(plan!.marketAssumptions).toEqual(basicTemplate.marketAssumptions);
    });
  });

  it('decreases snapshot count by 1 after undo', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });

    // 3 mutations → 3 snapshots
    for (let i = 0; i < 3; i++) {
      await asUser.mutation(api.income.upsertIncome, {
        planId,
        income: { ...basicTemplate.incomes[0], name: `step-${i}` },
      });
    }
    expect(await asUser.query(api.plan_snapshots.getCountOfSnapshots, { planId })).toBe(3);

    // Undo → 2 snapshots
    await asUser.mutation(api.plan_snapshots.undo, { planId });
    expect(await asUser.query(api.plan_snapshots.getCountOfSnapshots, { planId })).toBe(2);
  });

  it('throws when no snapshots available', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await expect(asUser.mutation(api.plan_snapshots.undo, { planId })).rejects.toThrow();
  });

  it('does not alter plan name or isDefault on undo', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ name: 'My Special Plan', isDefault: true }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });

    // Mutate something
    await asUser.mutation(api.income.upsertIncome, {
      planId,
      income: { ...basicTemplate.incomes[0], name: 'changed' },
    });

    // Undo
    await asUser.mutation(api.plan_snapshots.undo, { planId });

    // name and isDefault should be preserved (not overwritten by snapshot)
    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.name).toBe('My Special Plan');
      expect(plan!.isDefault).toBe(true);
    });
  });
});

// --- multiple sequential undos ---

describe('multiple sequential undos', () => {
  it('can undo multiple times to step back through history', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });

    // 3 mutations changing income name
    await asUser.mutation(api.income.upsertIncome, {
      planId,
      income: { ...basicTemplate.incomes[0], name: 'step-1' },
    });
    await asUser.mutation(api.income.upsertIncome, {
      planId,
      income: { ...basicTemplate.incomes[0], name: 'step-2' },
    });
    await asUser.mutation(api.income.upsertIncome, {
      planId,
      income: { ...basicTemplate.incomes[0], name: 'step-3' },
    });

    // Undo 1: back to step-2
    await asUser.mutation(api.plan_snapshots.undo, { planId });
    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.incomes.find((i) => i.id === 'income-1')!.name).toBe('step-2');
    });

    // Undo 2: back to step-1
    await asUser.mutation(api.plan_snapshots.undo, { planId });
    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.incomes.find((i) => i.id === 'income-1')!.name).toBe('step-1');
    });

    // Undo 3: back to original
    await asUser.mutation(api.plan_snapshots.undo, { planId });
    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.incomes.find((i) => i.id === 'income-1')!.name).toBe('software engineer salary');
    });
  });

  it('throws on undo after all snapshots consumed', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });

    // 2 mutations → 2 snapshots
    await asUser.mutation(api.income.upsertIncome, {
      planId,
      income: { ...basicTemplate.incomes[0], name: 'step-1' },
    });
    await asUser.mutation(api.income.upsertIncome, {
      planId,
      income: { ...basicTemplate.incomes[0], name: 'step-2' },
    });

    // Exhaust all snapshots
    await asUser.mutation(api.plan_snapshots.undo, { planId });
    await asUser.mutation(api.plan_snapshots.undo, { planId });

    // Next undo should throw
    await expect(asUser.mutation(api.plan_snapshots.undo, { planId })).rejects.toThrow();
  });
});

// --- snapshot cleanup on plan delete ---

describe('snapshot cleanup on plan delete', () => {
  it('deletes all snapshots when plan is deleted', async () => {
    const t = convexTest(schema, modules);

    // Create 2 plans (need at least 2 so one can be deleted)
    const [planId1, planId2] = await t.run(async (ctx) => {
      const p1 = await ctx.db.insert('plans', makePlan({ isDefault: true }));
      const p2 = await ctx.db.insert('plans', makePlan({ name: 'Plan 2' }));
      return [p1, p2];
    });

    const asUser = t.withIdentity({ subject: TEST_USER });

    // Create snapshots on plan 2
    await asUser.mutation(api.income.upsertIncome, {
      planId: planId2,
      income: { ...basicTemplate.incomes[0], name: 'changed-1' },
    });
    await asUser.mutation(api.income.upsertIncome, {
      planId: planId2,
      income: { ...basicTemplate.incomes[0], name: 'changed-2' },
    });

    // Delete plan 2
    await asUser.mutation(api.plans.deletePlan, { planId: planId2 });

    // Verify snapshots are gone
    await t.run(async (ctx) => {
      const snapshots = await ctx.db
        .query('planSnapshots')
        .withIndex('by_planId', (q) => q.eq('planId', planId2))
        .collect();
      expect(snapshots).toHaveLength(0);
    });

    // Plan 1 still exists
    await t.run(async (ctx) => {
      const plan1 = await ctx.db.get(planId1);
      expect(plan1).not.toBeNull();
    });
  });

  it('does not delete snapshots for other plans when one plan is deleted', async () => {
    const t = convexTest(schema, modules);

    const [_planId1, planId2, planId3] = await t.run(async (ctx) => {
      const p1 = await ctx.db.insert('plans', makePlan({ isDefault: true }));
      const p2 = await ctx.db.insert('plans', makePlan({ name: 'Plan 2' }));
      const p3 = await ctx.db.insert('plans', makePlan({ name: 'Plan 3' }));
      return [p1, p2, p3];
    });

    const asUser = t.withIdentity({ subject: TEST_USER });

    // Create snapshots on plan 2 and plan 3
    await asUser.mutation(api.income.upsertIncome, {
      planId: planId2,
      income: { ...basicTemplate.incomes[0], name: 'p2-change' },
    });
    await asUser.mutation(api.income.upsertIncome, {
      planId: planId3,
      income: { ...basicTemplate.incomes[0], name: 'p3-change' },
    });

    // Delete plan 2
    await asUser.mutation(api.plans.deletePlan, { planId: planId2 });

    // Plan 3's snapshots should still exist
    const count = await asUser.query(api.plan_snapshots.getCountOfSnapshots, { planId: planId3 });
    expect(count).toBe(1);
  });
});

// --- data integrity ---

describe('data integrity', () => {
  it('snapshot captures all plan data fields correctly', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });

    // Trigger a snapshot
    await asUser.mutation(api.income.upsertIncome, {
      planId,
      income: { ...basicTemplate.incomes[0], name: 'changed' },
    });

    // Verify all data fields are present in the snapshot
    await t.run(async (ctx) => {
      const snapshots = await ctx.db
        .query('planSnapshots')
        .withIndex('by_planId', (q) => q.eq('planId', planId))
        .collect();
      const snapshot = snapshots[0];

      expect(snapshot.timeline).toEqual(basicTemplate.timeline);
      expect(snapshot.incomes).toEqual(basicTemplate.incomes);
      expect(snapshot.expenses).toEqual(basicTemplate.expenses);
      expect(snapshot.accounts).toEqual(basicTemplate.accounts);
      expect(snapshot.contributionRules).toEqual(basicTemplate.contributionRules);
      expect(snapshot.baseContributionRule).toEqual(basicTemplate.baseContributionRule);
      expect(snapshot.marketAssumptions).toEqual(basicTemplate.marketAssumptions);
      expect(snapshot.taxSettings).toEqual(basicTemplate.taxSettings);
      expect(snapshot.privacySettings).toEqual(basicTemplate.privacySettings);
      expect(snapshot.simulationSettings).toEqual(basicTemplate.simulationSettings);
      expect(snapshot.debts).toEqual(basicTemplate.debts);
      expect(snapshot.physicalAssets).toEqual(basicTemplate.physicalAssets);
    });
  });

  it('snapshot does not include name or isDefault', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ name: 'My Plan', isDefault: true }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });

    await asUser.mutation(api.income.upsertIncome, {
      planId,
      income: { ...basicTemplate.incomes[0], name: 'changed' },
    });

    await t.run(async (ctx) => {
      const snapshots = await ctx.db
        .query('planSnapshots')
        .withIndex('by_planId', (q) => q.eq('planId', planId))
        .collect();
      const snapshot = snapshots[0] as Record<string, unknown>;
      expect(snapshot).not.toHaveProperty('name');
      expect(snapshot).not.toHaveProperty('isDefault');
    });
  });
});
