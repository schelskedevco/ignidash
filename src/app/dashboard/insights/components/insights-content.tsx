import { api } from '@/convex/_generated/api';

import { preloadAuthQuery } from '@/lib/auth-server';

import AIOutput from './ai-output';
import PlanSelector from './plan-selector';

export default async function InsightsContent() {
  const preloadedPlans = await preloadAuthQuery(api.plans.listPlans, {});

  return (
    <>
      <PlanSelector preloadedPlans={preloadedPlans} />
      <AIOutput />
    </>
  );
}
