import { preloadQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

import { getToken } from '@/lib/auth-server';

import PlansList from './plans-list';

export default async function DashboardContent() {
  const token = await getToken();
  if (!token) throw new Error('User not authenticated');

  const preloadedPlans = await preloadQuery(api.plans.listPlans, {}, { token });
  return <PlansList preloadedPlans={preloadedPlans} />;
}
