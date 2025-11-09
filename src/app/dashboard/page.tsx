'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

import MainArea from '@/components/layout/main-area';
import { Button } from '@/components/catalyst/button';

export default function DashboardPage() {
  const m = useMutation(api.plans.createPlan);

  return (
    <MainArea hasSecondaryColumn={false}>
      <h1 className="text-4xl font-extrabold tracking-tight">Dashboard</h1>
      <Button
        color="rose"
        onClick={async () => {
          const res = await m({ newPlanName: 'Demo Plan' });
          console.log('Created new plan:', res);
        }}
      >
        Create Simulation
      </Button>
    </MainArea>
  );
}
