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

// --- upsertAccount ---

describe('upsertAccount', () => {
  it('inserts new account when ID not found', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ accounts: [], contributionRules: [] }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.account.upsertAccount, {
      planId,
      account: { id: 'acc-new', name: 'New Account', balance: 5000, type: 'savings' },
    });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.accounts).toHaveLength(1);
      expect(plan!.accounts[0].id).toBe('acc-new');
      expect(plan!.accounts[0].name).toBe('New Account');
      expect(plan!.accounts[0].balance).toBe(5000);
    });
  });

  it('auto-creates a default contribution rule on insert', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ accounts: [], contributionRules: [] }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.account.upsertAccount, {
      planId,
      account: { id: 'acc-new', name: 'New', balance: 1000, type: 'savings' },
    });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.contributionRules).toHaveLength(1);
      const rule = plan!.contributionRules[0];
      expect(rule.accountId).toBe('acc-new');
      expect(rule.rank).toBe(1);
      expect(rule.amount).toEqual({ type: 'unlimited' });
      expect(rule.disabled).toBe(false);
    });
  });

  it('updates existing account without creating duplicate contribution rule', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.account.upsertAccount, {
      planId,
      account: { id: 'account-1', name: 'updated 401k', balance: 99999, type: '401k', percentBonds: 30 },
    });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.accounts).toHaveLength(4);
      expect(plan!.contributionRules).toHaveLength(5);
      const updated = plan!.accounts.find((a) => a.id === 'account-1');
      expect(updated!.name).toBe('updated 401k');
      expect(updated!.balance).toBe(99999);
      expect(updated!.percentBonds).toBe(30);
    });
  });

  it('throws at max 15 accounts on insert', async () => {
    const t = convexTest(schema, modules);
    const accounts = Array.from({ length: 15 }, (_, i) => ({
      id: `acc-${i}`,
      name: `Account ${i}`,
      balance: 1000,
      type: 'savings' as const,
    }));
    const contributionRules = accounts.map((acc, i) => ({
      id: `cr-${i}`,
      accountId: acc.id,
      rank: i + 1,
      amount: { type: 'unlimited' as const },
      disabled: false,
    }));
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ accounts, contributionRules }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await expect(
      asUser.mutation(api.account.upsertAccount, {
        planId,
        account: { id: 'acc-over-limit', name: 'Over Limit', balance: 0, type: 'savings' },
      })
    ).rejects.toThrow();
  });

  it('allows update when already at 15 accounts', async () => {
    const t = convexTest(schema, modules);
    const accounts = Array.from({ length: 15 }, (_, i) => ({
      id: `acc-${i}`,
      name: `Account ${i}`,
      balance: 1000,
      type: 'savings' as const,
    }));
    const contributionRules = accounts.map((acc, i) => ({
      id: `cr-${i}`,
      accountId: acc.id,
      rank: i + 1,
      amount: { type: 'unlimited' as const },
      disabled: false,
    }));
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ accounts, contributionRules }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.account.upsertAccount, {
      planId,
      account: { id: 'acc-0', name: 'Updated', balance: 2000, type: 'savings' },
    });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.accounts).toHaveLength(15);
      expect(plan!.accounts.find((a) => a.id === 'acc-0')!.name).toBe('Updated');
    });
  });
});

// --- upsertIncome ---

describe('upsertIncome', () => {
  const newIncome = {
    id: 'inc-new',
    name: 'New Income',
    amount: 60000,
    frequency: 'yearly' as const,
    timeframe: { start: { type: 'now' as const } },
    taxes: { incomeType: 'wage' as const, withholding: 20 },
    disabled: false,
  };

  it('inserts new income when ID not found', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ incomes: [] }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.income.upsertIncome, { planId, income: newIncome });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.incomes).toHaveLength(1);
      expect(plan!.incomes[0].id).toBe('inc-new');
      expect(plan!.incomes[0].name).toBe('New Income');
    });
  });

  it('updates existing income in-place', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    const updatedIncome = { ...basicTemplate.incomes[0], name: 'updated salary', amount: 100000 };
    await asUser.mutation(api.income.upsertIncome, { planId, income: updatedIncome });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.incomes).toHaveLength(2);
      const updated = plan!.incomes.find((i) => i.id === 'income-1');
      expect(updated!.name).toBe('updated salary');
      expect(updated!.amount).toBe(100000);
    });
  });

  it('throws at max 10 incomes on insert', async () => {
    const t = convexTest(schema, modules);
    const incomes = Array.from({ length: 10 }, (_, i) => ({
      id: `inc-${i}`,
      name: `Income ${i}`,
      amount: 50000,
      frequency: 'yearly' as const,
      timeframe: { start: { type: 'now' as const } },
      taxes: { incomeType: 'wage' as const, withholding: 20 },
      disabled: false,
    }));
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ incomes }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await expect(asUser.mutation(api.income.upsertIncome, { planId, income: newIncome })).rejects.toThrow();
  });

  it('allows update when at max 10', async () => {
    const t = convexTest(schema, modules);
    const incomes = Array.from({ length: 10 }, (_, i) => ({
      id: `inc-${i}`,
      name: `Income ${i}`,
      amount: 50000,
      frequency: 'yearly' as const,
      timeframe: { start: { type: 'now' as const } },
      taxes: { incomeType: 'wage' as const, withholding: 20 },
      disabled: false,
    }));
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ incomes }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.income.upsertIncome, {
      planId,
      income: { ...incomes[0], name: 'Updated' },
    });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.incomes).toHaveLength(10);
      expect(plan!.incomes.find((i) => i.id === 'inc-0')!.name).toBe('Updated');
    });
  });
});

// --- upsertExpense ---

describe('upsertExpense', () => {
  const newExpense = {
    id: 'exp-new',
    name: 'New Expense',
    amount: 10000,
    frequency: 'yearly' as const,
    timeframe: { start: { type: 'now' as const } },
    disabled: false,
  };

  it('inserts new expense when ID not found', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ expenses: [] }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.expense.upsertExpense, { planId, expense: newExpense });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.expenses).toHaveLength(1);
      expect(plan!.expenses[0].id).toBe('exp-new');
    });
  });

  it('updates existing expense in-place', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    const updatedExpense = { ...basicTemplate.expenses[0], name: 'updated living', amount: 70000 };
    await asUser.mutation(api.expense.upsertExpense, { planId, expense: updatedExpense });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.expenses).toHaveLength(2);
      const updated = plan!.expenses.find((e) => e.id === 'expense-1');
      expect(updated!.name).toBe('updated living');
      expect(updated!.amount).toBe(70000);
    });
  });

  it('throws at max 10 expenses on insert', async () => {
    const t = convexTest(schema, modules);
    const expenses = Array.from({ length: 10 }, (_, i) => ({
      id: `exp-${i}`,
      name: `Expense ${i}`,
      amount: 10000,
      frequency: 'yearly' as const,
      timeframe: { start: { type: 'now' as const } },
      disabled: false,
    }));
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ expenses }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await expect(asUser.mutation(api.expense.upsertExpense, { planId, expense: newExpense })).rejects.toThrow();
  });

  it('allows update when at max 10', async () => {
    const t = convexTest(schema, modules);
    const expenses = Array.from({ length: 10 }, (_, i) => ({
      id: `exp-${i}`,
      name: `Expense ${i}`,
      amount: 10000,
      frequency: 'yearly' as const,
      timeframe: { start: { type: 'now' as const } },
      disabled: false,
    }));
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ expenses }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.expense.upsertExpense, {
      planId,
      expense: { ...expenses[0], name: 'Updated' },
    });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.expenses).toHaveLength(10);
      expect(plan!.expenses.find((e) => e.id === 'exp-0')!.name).toBe('Updated');
    });
  });
});

// --- upsertDebt ---

describe('upsertDebt', () => {
  const newDebt = {
    id: 'debt-new',
    name: 'New Debt',
    balance: 15000,
    apr: 6,
    interestType: 'compound' as const,
    compoundingFrequency: 'monthly' as const,
    startDate: { type: 'now' as const },
    monthlyPayment: 300,
  };

  it('inserts new debt when plan.debts is undefined', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ debts: undefined }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.debt.upsertDebt, { planId, debt: newDebt });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.debts).toHaveLength(1);
      expect(plan!.debts![0].id).toBe('debt-new');
      expect(plan!.debts![0].balance).toBe(15000);
    });
  });

  it('updates existing debt in-place', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ debts: [newDebt] }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.debt.upsertDebt, {
      planId,
      debt: { ...newDebt, name: 'Updated Debt', balance: 10000 },
    });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.debts).toHaveLength(1);
      expect(plan!.debts![0].name).toBe('Updated Debt');
      expect(plan!.debts![0].balance).toBe(10000);
    });
  });

  it('throws at max 10 debts on insert', async () => {
    const t = convexTest(schema, modules);
    const debts = Array.from({ length: 10 }, (_, i) => ({
      id: `debt-${i}`,
      name: `Debt ${i}`,
      balance: 10000,
      apr: 5,
      interestType: 'compound' as const,
      compoundingFrequency: 'monthly' as const,
      startDate: { type: 'now' as const },
      monthlyPayment: 200,
    }));
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ debts }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await expect(asUser.mutation(api.debt.upsertDebt, { planId, debt: newDebt })).rejects.toThrow();
  });

  it('allows update when at max 10', async () => {
    const t = convexTest(schema, modules);
    const debts = Array.from({ length: 10 }, (_, i) => ({
      id: `debt-${i}`,
      name: `Debt ${i}`,
      balance: 10000,
      apr: 5,
      interestType: 'compound' as const,
      compoundingFrequency: 'monthly' as const,
      startDate: { type: 'now' as const },
      monthlyPayment: 200,
    }));
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ debts }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.debt.upsertDebt, {
      planId,
      debt: { ...debts[0], name: 'Updated' },
    });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.debts).toHaveLength(10);
      expect(plan!.debts!.find((d) => d.id === 'debt-0')!.name).toBe('Updated');
    });
  });
});

// --- upsertPhysicalAsset ---

describe('upsertPhysicalAsset', () => {
  const newPhysicalAsset = {
    id: 'pa-new',
    name: 'New House',
    purchaseDate: { type: 'now' as const },
    purchasePrice: 300000,
    appreciationRate: 3,
    paymentMethod: { type: 'cash' as const },
  };

  it('inserts new physical asset when plan.physicalAssets is undefined', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ physicalAssets: undefined }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.physical_asset.upsertPhysicalAsset, { planId, physicalAsset: newPhysicalAsset });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.physicalAssets).toHaveLength(1);
      expect(plan!.physicalAssets![0].id).toBe('pa-new');
      expect(plan!.physicalAssets![0].name).toBe('New House');
    });
  });

  it('updates existing physical asset in-place', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ physicalAssets: [newPhysicalAsset] }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.physical_asset.upsertPhysicalAsset, {
      planId,
      physicalAsset: { ...newPhysicalAsset, name: 'Updated House', purchasePrice: 400000 },
    });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.physicalAssets).toHaveLength(1);
      expect(plan!.physicalAssets![0].name).toBe('Updated House');
      expect(plan!.physicalAssets![0].purchasePrice).toBe(400000);
    });
  });

  it('throws at max 10 physical assets on insert', async () => {
    const t = convexTest(schema, modules);
    const physicalAssets = Array.from({ length: 10 }, (_, i) => ({
      id: `pa-${i}`,
      name: `Asset ${i}`,
      purchaseDate: { type: 'now' as const },
      purchasePrice: 100000,
      appreciationRate: 3,
      paymentMethod: { type: 'cash' as const },
    }));
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ physicalAssets }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await expect(asUser.mutation(api.physical_asset.upsertPhysicalAsset, { planId, physicalAsset: newPhysicalAsset })).rejects.toThrow();
  });
});

// --- upsertContributionRule ---

describe('upsertContributionRule', () => {
  const newRule = {
    id: 'cr-new',
    accountId: 'account-1',
    rank: 5,
    amount: { type: 'unlimited' as const },
    disabled: false,
  };

  it('inserts new contribution rule', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.contribution_rule.upsertContributionRule, { planId, contributionRule: newRule });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.contributionRules).toHaveLength(6);
      const inserted = plan!.contributionRules.find((r) => r.id === 'cr-new');
      expect(inserted).toBeDefined();
      expect(inserted!.accountId).toBe('account-1');
      expect(inserted!.rank).toBe(5);
    });
  });

  it('updates existing rule in-place', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    const updatedRule = {
      ...basicTemplate.contributionRules[0],
      amount: { type: 'percentRemaining' as const, percentRemaining: 50 },
    };
    await asUser.mutation(api.contribution_rule.upsertContributionRule, { planId, contributionRule: updatedRule });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.contributionRules).toHaveLength(5);
      const updated = plan!.contributionRules.find((r) => r.id === 'contribution-rule-1');
      expect(updated!.amount).toEqual({ type: 'percentRemaining', percentRemaining: 50 });
    });
  });

  it('throws at max 20 contribution rules on insert', async () => {
    const t = convexTest(schema, modules);
    const contributionRules = Array.from({ length: 20 }, (_, i) => ({
      id: `cr-${i}`,
      accountId: 'account-1',
      rank: i + 1,
      amount: { type: 'unlimited' as const },
      disabled: false,
    }));
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan({ contributionRules }));
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await expect(asUser.mutation(api.contribution_rule.upsertContributionRule, { planId, contributionRule: newRule })).rejects.toThrow();
  });
});

// --- deleteAccount ---

describe('deleteAccount', () => {
  it('removes account from array', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.account.deleteAccount, { planId, accountId: 'account-1' });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.accounts).toHaveLength(3);
      expect(plan!.accounts.find((a) => a.id === 'account-1')).toBeUndefined();
    });
  });

  it('removes contribution rules for that account and re-ranks remaining', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.account.deleteAccount, { planId, accountId: 'account-1' });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.contributionRules).toHaveLength(4);
      expect(plan!.contributionRules.find((r) => r.accountId === 'account-1')).toBeUndefined();
      // Re-ranked contiguously 1, 2, 3, 4
      expect(plan!.contributionRules.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
    });
  });

  it('preserves contribution rules for other accounts', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.account.deleteAccount, { planId, accountId: 'account-1' });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      const remainingAccountIds = plan!.contributionRules.map((r) => r.accountId);
      expect(remainingAccountIds).toContain('account-2');
      expect(remainingAccountIds).toContain('account-3');
      expect(remainingAccountIds).toContain('account-4');
    });
  });
});

// --- deleteIncome ---

describe('deleteIncome', () => {
  it('removes income from array', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.income.deleteIncome, { planId, incomeId: 'income-1' });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.incomes).toHaveLength(1);
      expect(plan!.incomes.find((i) => i.id === 'income-1')).toBeUndefined();
      expect(plan!.incomes[0].id).toBe('income-2');
    });
  });

  it('clears incomeId from contribution rules that reference the deleted income', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    // basicTemplate: rule-1 and rule-2 have incomeId: 'income-1', rule-3 has incomeId: 'income-2'
    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.income.deleteIncome, { planId, incomeId: 'income-1' });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      const rule1 = plan!.contributionRules.find((r) => r.id === 'contribution-rule-1');
      const rule2 = plan!.contributionRules.find((r) => r.id === 'contribution-rule-2');
      const rule3 = plan!.contributionRules.find((r) => r.id === 'contribution-rule-3');
      expect(rule1!.incomeId).toBeUndefined();
      expect(rule2!.incomeId).toBeUndefined();
      expect(rule3!.incomeId).toBe('income-2');
    });
  });

  it('does not affect contribution rules without an incomeId', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    // basicTemplate: rule-4 and rule-5 have no incomeId
    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.income.deleteIncome, { planId, incomeId: 'income-1' });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      const rule4 = plan!.contributionRules.find((r) => r.id === 'contribution-rule-4');
      const rule5 = plan!.contributionRules.find((r) => r.id === 'contribution-rule-5');
      expect(rule4!.incomeId).toBeUndefined();
      expect(rule5!.incomeId).toBeUndefined();
    });
  });
});

// --- deleteContributionRule ---

describe('deleteContributionRule', () => {
  it('removes rule from array', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.contribution_rule.deleteContributionRule, {
      planId,
      contributionRuleId: 'contribution-rule-2',
    });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.contributionRules).toHaveLength(4);
      expect(plan!.contributionRules.find((r) => r.id === 'contribution-rule-2')).toBeUndefined();
    });
  });

  it('re-ranks remaining rules contiguously', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    // Delete rule-2 (originally rank 2)
    await asUser.mutation(api.contribution_rule.deleteContributionRule, {
      planId,
      contributionRuleId: 'contribution-rule-2',
    });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.contributionRules.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
      // Verify order preserved: rule-1, rule-3, rule-4, rule-5
      expect(plan!.contributionRules.map((r) => r.id)).toEqual([
        'contribution-rule-1',
        'contribution-rule-3',
        'contribution-rule-4',
        'contribution-rule-5',
      ]);
    });
  });
});

// --- reorderContributionRules ---

describe('reorderContributionRules', () => {
  it('reorders rules and assigns correct ranks', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    // Reverse the order
    const newOrder = ['contribution-rule-5', 'contribution-rule-4', 'contribution-rule-3', 'contribution-rule-2', 'contribution-rule-1'];
    await asUser.mutation(api.contribution_rule.reorderContributionRules, { planId, newOrder });

    await t.run(async (ctx) => {
      const plan = await ctx.db.get(planId);
      expect(plan!.contributionRules).toHaveLength(5);
      expect(plan!.contributionRules[0].id).toBe('contribution-rule-5');
      expect(plan!.contributionRules[0].rank).toBe(1);
      expect(plan!.contributionRules[1].id).toBe('contribution-rule-4');
      expect(plan!.contributionRules[1].rank).toBe(2);
      expect(plan!.contributionRules[2].id).toBe('contribution-rule-3');
      expect(plan!.contributionRules[2].rank).toBe(3);
      expect(plan!.contributionRules[3].id).toBe('contribution-rule-2');
      expect(plan!.contributionRules[3].rank).toBe(4);
      expect(plan!.contributionRules[4].id).toBe('contribution-rule-1');
      expect(plan!.contributionRules[4].rank).toBe(5);
    });
  });

  it('throws when an ID in newOrder does not exist', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await expect(
      asUser.mutation(api.contribution_rule.reorderContributionRules, {
        planId,
        newOrder: ['contribution-rule-1', 'nonexistent-rule'],
      })
    ).rejects.toThrow();
  });
});
