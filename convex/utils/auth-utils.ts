import { QueryCtx } from '../_generated/server';
import { authComponent } from '../auth';

export type UserId = NonNullable<Awaited<ReturnType<typeof authComponent.safeGetAuthUser>>>['_id'];

export async function getUserIdOrThrow(ctx: QueryCtx): Promise<UserId> {
  const user = await authComponent.safeGetAuthUser(ctx);
  const userId = user?._id;

  if (!userId) throw new Error('User not authenticated');

  return userId;
}
