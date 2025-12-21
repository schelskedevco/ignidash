import { api } from '@/convex/_generated/api';

import { preloadAuthQuery } from '@/lib/auth-server';

import PlansList from './plans-list';

export default async function DashboardContent() {
  const [preloadedPlans, preloadedAssets, preloadedLiabilities] = await Promise.all([
    preloadAuthQuery(api.plans.listPlans, {}),
    preloadAuthQuery(api.finances.getAssets, {}),
    preloadAuthQuery(api.finances.getLiabilities, {}),
  ]);

  return <PlansList preloadedPlans={preloadedPlans} preloadedAssets={preloadedAssets} preloadedLiabilities={preloadedLiabilities} />;
}
