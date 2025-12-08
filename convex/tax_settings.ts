import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

import { taxSettingsValidator } from './validators/tax_settings_validator';
import { getPlanForCurrentUserOrThrow } from './utils/plan_utils';

export const get = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    return plan.taxSettings;
  },
});

export const update = mutation({
  args: {
    planId: v.id('plans'),
    taxSettings: taxSettingsValidator,
  },
  handler: async (ctx, { planId, taxSettings }) => {
    await getPlanForCurrentUserOrThrow(ctx, planId);

    await ctx.db.patch(planId, { taxSettings });
  },
});
