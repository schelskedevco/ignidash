import { preloadQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { redirect } from 'next/navigation';

import { getToken } from '@/lib/auth-server';

import AIOutput from './ai-output';
import PlanSelector from './plan-selector';

export default async function InsightsContent() {
  const token = await getToken();
  if (!token) redirect('/signin');

  const preloadedPlans = await preloadQuery(api.plans.listPlans, {}, { token });

  return (
    <>
      <PlanSelector preloadedPlans={preloadedPlans} />
      <AIOutput />
    </>
  );
}
