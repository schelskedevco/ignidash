import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

import { privacySettingsValidator } from './validators/privacy_settings_validator';
import { getPlanForCurrentUserOrThrow } from './utils/plan_utils';

export const get = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    return plan.privacySettings;
  },
});

export const update = mutation({
  args: {
    planId: v.id('plans'),
    privacySettings: privacySettingsValidator,
  },
  handler: async (ctx, { planId, privacySettings }) => {
    await getPlanForCurrentUserOrThrow(ctx, planId);

    await ctx.db.patch(planId, { privacySettings });
  },
});
