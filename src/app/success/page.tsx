import { Suspense } from 'react';
import { api } from '@/convex/_generated/api';

import PageLoading from '@/components/ui/page-loading';
import { fetchAuthAction } from '@/lib/auth-server';

import SubscriptionOverview from './subscription-overview';

export default async function SuccessPage() {
  const subscription = await fetchAuthAction(api.auth.getActiveStripeSubscription, {});
  if (!subscription) throw new Error('Subscription not found');

  return (
    <Suspense fallback={<PageLoading ariaLabel="Loading subscription overview page" message="Loading" />}>
      <SubscriptionOverview subscription={subscription} />
    </Suspense>
  );
}
