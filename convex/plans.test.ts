/// <reference types="vite/client" />
// @vitest-environment edge-runtime
import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';
import { api } from './_generated/api';
import schema from './schema';
import { basicTemplate } from './templates/basic';
import { earlyRetirementTemplate } from './templates/early_retirement';

const modules = import.meta.glob('./**/*.ts');

const TEST_USER = 'test-user-123';

type PlanOverrides = Partial<typeof basicTemplate> & { name?: string };

function makePlan(overrides: PlanOverrides = {}) {
  return { ...basicTemplate, userId: TEST_USER, name: 'Test Plan', ...overrides };
}

// --- deletePlan ---

describe('deletePlan', () => {
  it('deletes plan and removes it from DB', async () => {
    const t = convexTest(schema, modules);
    const defaultPlanId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ isDefault: true }));
    });
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ name: 'To Delete', isDefault: false }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.plans.deletePlan, { planId });

    await t.run(async (ctx) => {
      const deleted = await ctx.db.get(planId);
      expect(deleted).toBeNull();
      const remaining = await ctx.db.get(defaultPlanId);
      expect(remaining).not.toBeNull();
    });
  });

  it('cascades: deletes conversations, messages, and insights for the plan', async () => {
    const t = convexTest(schema, modules);
    const defaultPlanId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ isDefault: true }));
    });
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ name: 'To Delete', isDefault: false }));
    });

    // Create conversation + messages + insight for the plan being deleted
    const convId = await t.run(async (ctx) => {
      return ctx.db.insert('conversations', {
        userId: TEST_USER,
        planId,
        title: 'Test Conversation',
        updatedAt: Date.now(),
      });
    });
    await t.run(async (ctx) => {
      await ctx.db.insert('messages', {
        userId: TEST_USER,
        conversationId: convId,
        author: 'user',
        body: 'Hello',
        updatedAt: Date.now(),
      });
      await ctx.db.insert('messages', {
        userId: TEST_USER,
        conversationId: convId,
        author: 'assistant',
        body: 'Hi there',
        updatedAt: Date.now(),
      });
      await ctx.db.insert('insights', {
        userId: TEST_USER,
        planId,
        content: 'Test insight',
        updatedAt: Date.now(),
      });
    });

    // Create conversation + insight for the OTHER plan (should survive)
    const otherConvId = await t.run(async (ctx) => {
      return ctx.db.insert('conversations', {
        userId: TEST_USER,
        planId: defaultPlanId,
        title: 'Other Conversation',
        updatedAt: Date.now(),
      });
    });
    const otherMsgId = await t.run(async (ctx) => {
      return ctx.db.insert('messages', {
        userId: TEST_USER,
        conversationId: otherConvId,
        author: 'user',
        body: 'Keep me',
        updatedAt: Date.now(),
      });
    });
    const otherInsightId = await t.run(async (ctx) => {
      return ctx.db.insert('insights', {
        userId: TEST_USER,
        planId: defaultPlanId,
        content: 'Keep this insight',
        updatedAt: Date.now(),
      });
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.plans.deletePlan, { planId });

    await t.run(async (ctx) => {
      // Deleted plan's conversation and messages should be gone
      const conv = await ctx.db.get(convId);
      expect(conv).toBeNull();
      const msgs = await ctx.db
        .query('messages')
        .withIndex('by_conversationId_updatedAt', (q) => q.eq('conversationId', convId))
        .collect();
      expect(msgs).toHaveLength(0);
      const insights = await ctx.db
        .query('insights')
        .withIndex('by_planId_updatedAt', (q) => q.eq('planId', planId))
        .collect();
      expect(insights).toHaveLength(0);

      // Other plan's data should survive
      expect(await ctx.db.get(otherConvId)).not.toBeNull();
      expect(await ctx.db.get(otherMsgId)).not.toBeNull();
      expect(await ctx.db.get(otherInsightId)).not.toBeNull();
    });
  });

  it('throws when trying to delete the only plan', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ isDefault: false }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await expect(asUser.mutation(api.plans.deletePlan, { planId })).rejects.toThrow('cannot delete your only plan');
  });

  it('throws when trying to delete the default plan', async () => {
    const t = convexTest(schema, modules);
    const defaultPlanId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ isDefault: true }));
    });
    await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ name: 'Other', isDefault: false }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await expect(asUser.mutation(api.plans.deletePlan, { planId: defaultPlanId })).rejects.toThrow('cannot delete your default plan');
  });
});

// --- clonePlan ---

describe('clonePlan', () => {
  it('clones an existing plan with correct data', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ isDefault: true }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    const clonedId = await asUser.mutation(api.plans.clonePlan, { newPlanName: 'Clone', planId });

    await t.run(async (ctx) => {
      const cloned = await ctx.db.get(clonedId);
      expect(cloned).not.toBeNull();
      expect(cloned!.name).toBe('Clone');
      expect(cloned!.isDefault).toBe(false);
      expect(cloned!.incomes).toHaveLength(basicTemplate.incomes.length);
      expect(cloned!.accounts).toHaveLength(basicTemplate.accounts.length);
      expect(cloned!.contributionRules).toHaveLength(basicTemplate.contributionRules.length);
    });
  });

  it('clones from template1 (basicTemplate)', async () => {
    const t = convexTest(schema, modules);

    const asUser = t.withIdentity({ subject: TEST_USER });
    const clonedId = await asUser.mutation(api.plans.clonePlan, { newPlanName: 'From Basic', planId: 'template1' });

    await t.run(async (ctx) => {
      const cloned = await ctx.db.get(clonedId);
      expect(cloned!.name).toBe('From Basic');
      expect(cloned!.isDefault).toBe(false);
      expect(cloned!.timeline).toEqual(basicTemplate.timeline);
      expect(cloned!.incomes).toEqual(basicTemplate.incomes);
      expect(cloned!.accounts).toEqual(basicTemplate.accounts);
      expect(cloned!.marketAssumptions).toEqual(basicTemplate.marketAssumptions);
    });
  });

  it('clones from template2 (earlyRetirementTemplate)', async () => {
    const t = convexTest(schema, modules);

    const asUser = t.withIdentity({ subject: TEST_USER });
    const clonedId = await asUser.mutation(api.plans.clonePlan, { newPlanName: 'From FIRE', planId: 'template2' });

    await t.run(async (ctx) => {
      const cloned = await ctx.db.get(clonedId);
      expect(cloned!.name).toBe('From FIRE');
      expect(cloned!.timeline).toEqual(earlyRetirementTemplate.timeline);
      expect(cloned!.incomes).toEqual(earlyRetirementTemplate.incomes);
      expect(cloned!.accounts).toEqual(earlyRetirementTemplate.accounts);
      expect(cloned!.marketAssumptions).toEqual(earlyRetirementTemplate.marketAssumptions);
    });
  });

  it('throws at max 10 plans', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      for (let i = 0; i < 10; i++) {
        await ctx.db.insert('plans', makePlan({ name: `Plan ${i}`, isDefault: i === 0 }));
      }
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await expect(asUser.mutation(api.plans.clonePlan, { newPlanName: 'Over Limit', planId: 'template1' })).rejects.toThrow();
  });
});

// --- setPlanAsDefault ---

describe('setPlanAsDefault', () => {
  it('sets target plan as default and unsets previous default', async () => {
    const t = convexTest(schema, modules);
    const defaultPlanId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ isDefault: true }));
    });
    const otherPlanId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ name: 'Other', isDefault: false }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.plans.setPlanAsDefault, { planId: otherPlanId });

    await t.run(async (ctx) => {
      const oldDefault = await ctx.db.get(defaultPlanId);
      expect(oldDefault!.isDefault).toBe(false);
      const newDefault = await ctx.db.get(otherPlanId);
      expect(newDefault!.isDefault).toBe(true);
    });
  });

  it('no-ops when plan is already default', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ isDefault: true }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.plans.setPlanAsDefault, { planId });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.isDefault).toBe(true);
    });
  });

  it('handles multiple plans correctly — only one default after', async () => {
    const t = convexTest(schema, modules);
    const planIds = await t.run(async (ctx) => {
      const ids = [];
      for (let i = 0; i < 4; i++) {
        ids.push(await ctx.db.insert('plans', makePlan({ name: `Plan ${i}`, isDefault: i === 0 })));
      }
      return ids;
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.plans.setPlanAsDefault, { planId: planIds[2] });

    await t.run(async (ctx) => {
      const plans = await ctx.db
        .query('plans')
        .withIndex('by_userId', (q) => q.eq('userId', TEST_USER))
        .collect();
      const defaults = plans.filter((p) => p.isDefault);
      expect(defaults).toHaveLength(1);
      expect(defaults[0]._id).toEqual(planIds[2]);
    });
  });
});

// --- createBlankPlan ---

describe('createBlankPlan', () => {
  it('creates plan with empty arrays and correct defaults', async () => {
    const t = convexTest(schema, modules);

    const asUser = t.withIdentity({ subject: TEST_USER });
    const planId = await asUser.mutation(api.plans.createBlankPlan, { newPlanName: 'Blank Plan' });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan).not.toBeNull();
      expect(plan!.name).toBe('Blank Plan');
      expect(plan!.isDefault).toBe(false);
      expect(plan!.timeline).toBeNull();
      expect(plan!.incomes).toEqual([]);
      expect(plan!.expenses).toEqual([]);
      expect(plan!.debts).toEqual([]);
      expect(plan!.physicalAssets).toEqual([]);
      expect(plan!.accounts).toEqual([]);
      expect(plan!.contributionRules).toEqual([]);
      expect(plan!.baseContributionRule).toEqual({ type: 'save' });
    });
  });

  it('throws at max 10 plans', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      for (let i = 0; i < 10; i++) {
        await ctx.db.insert('plans', makePlan({ name: `Plan ${i}` }));
      }
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await expect(asUser.mutation(api.plans.createBlankPlan, { newPlanName: 'Over Limit' })).rejects.toThrow();
  });
});

// --- getOrCreateDefaultPlan ---

describe('getOrCreateDefaultPlan', () => {
  it('returns existing default plan ID when one exists', async () => {
    const t = convexTest(schema, modules);
    const existingDefaultId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ isDefault: true }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER, name: 'Test User' });
    const result = await asUser.mutation(api.plans.getOrCreateDefaultPlan, {});

    expect(result).toEqual(existingDefaultId);
  });

  it('creates new default plan when none exists', async () => {
    const t = convexTest(schema, modules);

    const asUser = t.withIdentity({ subject: TEST_USER, name: 'Test User' });
    const result = await asUser.mutation(api.plans.getOrCreateDefaultPlan, {});

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(result);
      expect(plan).not.toBeNull();
      expect(plan!.isDefault).toBe(true);
      expect(plan!.name).toBe("Test User's Plan");
      expect(plan!.incomes).toEqual([]);
      expect(plan!.accounts).toEqual([]);
    });
  });
});
