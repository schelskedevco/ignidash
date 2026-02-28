import { Migrations } from '@convex-dev/migrations';

import { components, internal } from './_generated/api';
import { DataModel } from './_generated/dataModel';

export const migrations = new Migrations<DataModel>(components.migrations);

export const run = migrations.runner();

// Runs all pending migrations in order. Called automatically during selfhost upgrades.
// Append new migrations to the end of this array — never remove entries.
export const runAll = migrations.runner([internal.migrations.migrateIncomeIdsToIncomeId]);

export const migrateIncomeIdsToIncomeId = migrations.define({
  table: 'plans',
  migrateOne: async (ctx, plan) => {
    const updatedRules = plan.contributionRules.map((rule) => {
      const { incomeIds, ...rest } = rule;
      return {
        ...rest,
        incomeId: incomeIds?.[0],
      };
    });
    return { contributionRules: updatedRules };
  },
});
