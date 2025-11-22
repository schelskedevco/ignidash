import { mutation } from './_generated/server';

import { getUserIdOrThrow } from './utils/auth_utils';
import { deleteAllPlansForUser } from './utils/plan_utils';

export const deleteAppData = mutation({
  handler: async (ctx) => {
    const { userId, userName } = await getUserIdOrThrow(ctx);
    await deleteAllPlansForUser(ctx, userId);

    // Create blank plan after deleting all plans
    await ctx.db.insert('plans', {
      userId,
      name: `${userName}'s Plan`,
      isDefault: false,
      timeline: null,
      incomes: [],
      expenses: [],
      accounts: [],
      contributionRules: [],
      baseContributionRule: { type: 'save' },
      marketAssumptions: { stockReturn: 10, stockYield: 3.5, bondReturn: 5, bondYield: 4.5, cashReturn: 3, inflationRate: 3 },
      taxSettings: { filingStatus: 'single' },
      privacySettings: { isPrivate: true },
    });
  },
});
