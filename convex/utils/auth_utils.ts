import { QueryCtx } from '../_generated/server';
import { authComponent } from '../auth';

export async function getUserIdOrThrow(ctx: QueryCtx): Promise<{ userId: string; userName: string }> {
  const user = await authComponent.safeGetAuthUser(ctx);
  const userId = user?._id;

  if (!userId) throw new Error('User not authenticated');

  return { userId, userName: user?.name || 'Anonymous' };
}
