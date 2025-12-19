'use client';

import { useMemo } from 'react';
import { Preloaded, usePreloadedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';

import { Heading } from '@/components/catalyst/heading';
import { Button } from '@/components/catalyst/button';
import { simulatorFromConvex } from '@/lib/utils/convex-to-zod-transformers';
import { useSimulationResult, useKeyMetrics, useIsCalculationReady, useUpdateInsightsSelectedPlan } from '@/lib/stores/simulator-store';

interface PlanListItemProps {
  plan: Doc<'plans'>;
}

function PlanListItem({ plan }: PlanListItemProps) {
  const inputs = useMemo(() => simulatorFromConvex(plan), [plan]);

  const { timelineIsReady, accountsAreReady, incomesAreReady, expensesAreReady } = useIsCalculationReady(inputs);
  const isCalculationReady = timelineIsReady && accountsAreReady && incomesAreReady && expensesAreReady;

  const simulation = useSimulationResult(inputs, 'fixedReturns');
  const keyMetrics = useKeyMetrics(simulation);

  const status = !isCalculationReady ? 'In progress' : keyMetrics?.success ? 'Success' : 'Failed';

  const updateInsightsSelectedPlan = useUpdateInsightsSelectedPlan();

  return (
    <li key={plan._id} className="relative flex items-center space-x-4 px-4 py-4 hover:bg-zinc-50 sm:px-6 lg:px-8 dark:hover:bg-black/10">
      <div className="min-w-0 flex-auto">
        <div className="flex items-center gap-x-3">
          <p className="truncate text-sm/6 font-semibold text-zinc-900 dark:text-white">{plan.name}</p>
          {status === 'In progress' ? (
            <p className="mt-0.5 hidden rounded-md bg-zinc-50 px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-zinc-600 inset-ring inset-ring-zinc-500/10 sm:block dark:bg-zinc-400/10 dark:text-zinc-400 dark:inset-ring-zinc-400/20">
              {status}
            </p>
          ) : null}
          {status === 'Success' ? (
            <p className="mt-0.5 hidden rounded-md bg-green-50 px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-green-700 inset-ring inset-ring-green-600/20 sm:block dark:bg-green-400/10 dark:text-green-400 dark:inset-ring-green-500/20">
              {status}
            </p>
          ) : null}
          {status === 'Failed' ? (
            <p className="mt-0.5 hidden rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-red-700 inset-ring inset-ring-red-600/20 sm:block dark:bg-red-400/10 dark:text-red-400 dark:inset-ring-red-500/20">
              {status}
            </p>
          ) : null}
        </div>
        <div className="mt-1 flex items-center gap-x-2 text-xs/5 text-zinc-500 dark:text-zinc-400">
          <p className="whitespace-nowrap">
            Created <time dateTime={new Date(plan._creationTime).toISOString()}>{new Date(plan._creationTime).toLocaleDateString()}</time>
          </p>
          {plan.isDefault && (
            <>
              <svg viewBox="0 0 2 2" className="size-0.5 fill-current">
                <circle r={1} cx={1} cy={1} />
              </svg>
              <p className="truncate">Default plan</p>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-none items-center gap-x-4">
        {keyMetrics && simulation ? (
          <Button
            outline
            onClick={() => updateInsightsSelectedPlan({ id: plan._id, name: plan.name, keyMetrics, simulationResult: simulation })}
          >
            Select
            <span className="sr-only">, {plan.name}</span>
          </Button>
        ) : (
          <Button outline disabled>
            Select
            <span className="sr-only">, {plan.name}</span>
          </Button>
        )}
      </div>
    </li>
  );
}

interface PlanSelectorProps {
  preloadedPlans: Preloaded<typeof api.plans.listPlans>;
}

export default function PlanSelector({ preloadedPlans }: PlanSelectorProps) {
  const plans = usePreloadedQuery(preloadedPlans);

  return (
    <aside className="border-border/50 -mx-2 border-b sm:-mx-3 lg:fixed lg:top-[4.3125rem] lg:right-0 lg:bottom-0 lg:mx-0 lg:w-96 lg:overflow-y-auto lg:border-t-0 lg:border-l lg:bg-zinc-50 dark:lg:bg-black/10">
      <header className="from-emphasized-background to-background border-border/50 flex items-center justify-between border-b bg-gradient-to-l px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <Heading level={4}>Plans</Heading>
      </header>
      <ul role="list" className="divide-border/25 divide-y">
        {plans.map((plan) => (
          <PlanListItem key={plan._id} plan={plan} />
        ))}
      </ul>
    </aside>
  );
}
