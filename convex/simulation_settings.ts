import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

import { simulationSettingsValidator } from './validators/simulation_settings_validator';
import { getPlanForCurrentUserOrThrow } from './utils/plan_utils';

export const get = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    return plan.simulationSettings;
  },
});

export const update = mutation({
  args: {
    planId: v.id('plans'),
    simulationSettings: simulationSettingsValidator,
  },
  handler: async (ctx, { planId, simulationSettings }) => {
    await getPlanForCurrentUserOrThrow(ctx, planId);

    await ctx.db.patch(planId, { simulationSettings });
  },
});
