import { preloadQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { redirect } from 'next/navigation';

import { getToken } from '@/lib/auth-server';

import PlansList from './plans-list';

export default async function DashboardContent() {
  const token = await getToken();
  if (!token) redirect('/signin');

  const [preloadedPlans, preloadedAssets, preloadedLiabilities] = await Promise.all([
    preloadQuery(api.plans.listPlans, {}, { token }),
    preloadQuery(api.finances.getAssets, {}, { token }),
    preloadQuery(api.finances.getLiabilities, {}, { token }),
  ]);

  return <PlansList preloadedPlans={preloadedPlans} preloadedAssets={preloadedAssets} preloadedLiabilities={preloadedLiabilities} />;
}
