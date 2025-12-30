import { Migrations } from '@convex-dev/migrations';
import { components } from './_generated/api';
import { DataModel } from './_generated/dataModel';

export const migrations = new Migrations<DataModel>(components.migrations);

export const cleanupCurrentAge = migrations.define({
  table: 'plans',
  migrateOne: async (ctx, plan) => {
    const timeline = plan.timeline;
    if (!timeline) return;

    const { currentAge: _currentAge, ...rest } = timeline;

    return {
      timeline: {
        ...rest,
        birthMonth: 1,
      },
    };
  },
});

export const run = migrations.runner();
