import { Suspense } from 'react';
import { Polar } from '@polar-sh/sdk';

import PageLoading from '@/components/ui/page-loading';

import SubscriptionOverview from './subscription-overview';

const polar = new Polar({ accessToken: process.env.POLAR_ACCESS_TOKEN! });

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout_id?: string; customer_session_token?: string }>;
}) {
  const { customer_session_token } = await searchParams;

  const subscriptions = await polar.customerPortal.subscriptions.list({ customerSession: customer_session_token ?? '' }, { limit: 1 });
  const subscription = subscriptions.result.items[0];

  return (
    <Suspense fallback={<PageLoading ariaLabel="Loading subscription overview page" message="Loading" />}>
      <SubscriptionOverview subscription={subscription} />
    </Suspense>
  );
}
