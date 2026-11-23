/// <reference types="vite/client" />
// @vitest-environment edge-runtime
import migrationsComponent from '@convex-dev/migrations/test';
import { runToCompletion } from '@convex-dev/migrations';
import { convexTest } from 'convex-test';
import { expect, test } from 'vitest';

import { components, internal } from './_generated/api';
import schema from './schema';
import { basicTemplate } from './templates/basic';

const modules = import.meta.glob('./**/*.ts');

test('income ID migration converts legacy rules without clearing current values', async () => {
  const t = convexTest(schema, modules);
  migrationsComponent.register(t);

  const currentRule = { ...basicTemplate.contributionRules[0], incomeId: 'current-income' };
  const { incomeId: _incomeId, ...legacyRule } = basicTemplate.contributionRules[1];

  const planId = await t.run(async (ctx) =>
    ctx.db.insert('plans', {
      ...basicTemplate,
      userId: 'migration-test-user',
      name: 'Migration test',
      contributionRules: [currentRule, { ...legacyRule, incomeIds: ['legacy-income'] }],
    })
  );

  await t.run(async (ctx) => {
    await runToCompletion(ctx, components.migrations, internal.migrations.migrateIncomeIdsToIncomeId);
  });

  await t.run(async (ctx) => {
    const plan = await ctx.db.get(planId);
    expect(plan?.contributionRules[0]?.incomeId).toBe('current-income');
    expect(plan?.contributionRules[1]?.incomeId).toBe('legacy-income');
    expect(plan?.contributionRules.every((rule) => rule.incomeIds === undefined)).toBe(true);
  });

  await t.run(async (ctx) => {
    await runToCompletion(ctx, components.migrations, internal.migrations.migrateIncomeIdsToIncomeId);
  });

  await t.run(async (ctx) => {
    const plan = await ctx.db.get(planId);
    expect(plan?.contributionRules[0]?.incomeId).toBe('current-income');
    expect(plan?.contributionRules[1]?.incomeId).toBe('legacy-income');
  });
});
