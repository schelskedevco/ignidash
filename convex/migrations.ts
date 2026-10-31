import { Migrations, type MigrationFunctionReference, type MigrationStatus } from '@convex-dev/migrations';

import { components, internal } from './_generated/api';
import { DataModel } from './_generated/dataModel';
import { internalQuery } from './_generated/server';

export const migrations = new Migrations<DataModel>(components.migrations);

export const run = migrations.runner();

// Runs all pending migrations in order. Called automatically during selfhost upgrades.
// Append new migrations to the end of this array — never remove entries.
const allMigrations: MigrationFunctionReference[] = [internal.migrations.migrateIncomeIdsToIncomeId];

export const runAll = migrations.runner(allMigrations);

export const getStatus = internalQuery({
  args: {},
  handler: async (ctx): Promise<MigrationStatus[]> => migrations.getStatus(ctx, { migrations: allMigrations }),
});

export const migrateIncomeIdsToIncomeId = migrations.define({
  table: 'plans',
  migrateOne: async (ctx, plan) => {
    const updatedRules = plan.contributionRules.map((rule) => {
      const { incomeIds, ...rest } = rule;
      return {
        ...rest,
        incomeId: rule.incomeId ?? incomeIds?.[0],
      };
    });
    return { contributionRules: updatedRules };
  },
});
