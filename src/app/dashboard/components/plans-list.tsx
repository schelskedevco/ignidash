'use client';

import { useMemo, useState, useCallback } from 'react';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import type { Preloaded } from 'convex/react';
import { usePreloadedAuthQuery } from '@convex-dev/better-auth/nextjs/client';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/16/solid';
import posthog from 'posthog-js';

import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { Heading } from '@/components/catalyst/heading';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/catalyst/dropdown';
import {
  useSimulationResult,
  useKeyMetrics,
  useIsCalculationReady,
  useInsightsSelectedPlan,
  useUpdateInsightsSelectedPlan,
  useClearSelectedConversationId,
} from '@/lib/stores/simulator-store';
import { simulatorFromConvex } from '@/lib/utils/convex-to-zod-transformers';
import DeleteDataItemAlert from '@/components/ui/delete-data-item-alert';

import PlanDialog from './dialogs/plan-dialog';
import Finances from './finances';

interface PlanListItems {
  plan: Doc<'plans'>;
  onDropdownClickEdit: () => void;
  onDropdownClickClone: () => void;
  onDropdownClickDelete: () => void;
  onDropdownClickSetAsDefault: () => void;
  disableActions: { disableEdit?: boolean; disableClone?: boolean; disableDelete?: boolean };
}

function PlanListItem({
  plan,
  onDropdownClickEdit,
  onDropdownClickClone,
  onDropdownClickDelete,
  onDropdownClickSetAsDefault,
  disableActions,
}: PlanListItems) {
  const handleCopyAsJson = useCallback(() => {
    const { _id, _creationTime, userId: _userId, ...planData } = plan;
    navigator.clipboard.writeText(JSON.stringify(planData, null, 2));
  }, [plan]);

  const inputs = useMemo(() => simulatorFromConvex(plan), [plan]);

  const { timelineIsReady, accountsAreReady, incomesAreReady, expensesAreReady } = useIsCalculationReady(inputs);
  const isCalculationReady = timelineIsReady && accountsAreReady && incomesAreReady && expensesAreReady;

  const simulation = useSimulationResult(inputs, 'fixedReturns');
  const keyMetrics = useKeyMetrics(simulation);

  const status = !isCalculationReady ? 'In progress' : keyMetrics?.success ? 'Success' : 'Failed';

  const { disableEdit, disableClone, disableDelete } = disableActions;

  return (
    <li key={plan._id} className="relative flex items-center space-x-4 px-4 py-4 hover:bg-stone-50 sm:px-6 lg:px-8 dark:hover:bg-black/10">
      <div className="min-w-0 flex-auto">
        <div className="flex items-center gap-x-3">
          <p className="truncate text-sm/6 font-semibold text-stone-900 dark:text-white">{plan.name}</p>
          {status === 'In progress' ? (
            <p className="mt-0.5 hidden rounded-md bg-stone-50 px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-stone-600 inset-ring inset-ring-stone-500/10 sm:block dark:bg-stone-400/10 dark:text-stone-400 dark:inset-ring-stone-400/20">
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
        <div className="mt-1 flex items-center gap-x-2 text-xs/5 text-stone-500 dark:text-stone-400">
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
        <Button outline href={`/dashboard/simulator/${plan._id}`}>
          View
          <span className="sr-only">, {plan.name}</span>
        </Button>
        <div className="relative flex-none">
          <Dropdown>
            <DropdownButton plain aria-label="Open options">
              <EllipsisVerticalIcon />
            </DropdownButton>
            <DropdownMenu portal={false}>
              <DropdownItem disabled={disableEdit} onClick={onDropdownClickEdit}>
                Edit
              </DropdownItem>
              <DropdownItem disabled={disableClone} onClick={onDropdownClickClone}>
                Clone
              </DropdownItem>
              <DropdownItem disabled={disableDelete} onClick={onDropdownClickDelete}>
                Delete
              </DropdownItem>
              {!plan.isDefault && <DropdownItem onClick={onDropdownClickSetAsDefault}>Set as default</DropdownItem>}
              <DropdownItem onClick={handleCopyAsJson}>Copy JSON</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </li>
  );
}

interface PlanListProps {
  preloadedPlans: Preloaded<typeof api.plans.listPlans>;
  preloadedAssets: Preloaded<typeof api.finances.getAssets>;
  preloadedLiabilities: Preloaded<typeof api.finances.getLiabilities>;
}

export default function PlanList({ preloadedPlans, preloadedAssets, preloadedLiabilities }: PlanListProps) {
  const plans = usePreloadedAuthQuery(preloadedPlans);
  const allPlans = useMemo(() => plans?.map((plan) => ({ id: plan._id, name: plan.name })) ?? [], [plans]);

  const [planDialogOpen, setPlanDialogOpen] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState<Doc<'plans'> | null>(null);
  const [planToClone, setPlanToClone] = useState<{ id: Id<'plans'>; name: string } | undefined>(undefined);

  const handlePlanDialogClose = () => {
    setSelectedPlan(null);
    setPlanToClone(undefined);
    setPlanDialogOpen(false);
  };

  const handleEdit = (plan: Doc<'plans'>) => {
    setSelectedPlan(plan);
    setPlanDialogOpen(true);
  };

  const handleClone = (plan: { id: Id<'plans'>; name: string }) => {
    setPlanToClone(plan);
    setPlanDialogOpen(true);
  };

  const insightsSelectedPlan = useInsightsSelectedPlan();
  const updateInsightsSelectedPlan = useUpdateInsightsSelectedPlan();
  const clearSelectedConversationId = useClearSelectedConversationId();

  const [planToDelete, setPlanToDelete] = useState<{ id: string; name: string } | null>(null);
  const deleteMutation = useMutation(api.plans.deletePlan);
  const deletePlan = useCallback(
    async (planId: string) => {
      if (insightsSelectedPlan?.id === planId) updateInsightsSelectedPlan(undefined);
      clearSelectedConversationId(planId as Id<'plans'>);

      posthog.capture('delete_plan', { planId });
      await deleteMutation({ planId: planId as Id<'plans'> });
    },
    [deleteMutation, insightsSelectedPlan, updateInsightsSelectedPlan, clearSelectedConversationId]
  );

  const setAsDefaultMutation = useMutation(api.plans.setPlanAsDefault);
  const handleSetAsDefault = useCallback(
    async (planId: Id<'plans'>) => {
      posthog.capture('set_plan_as_default', { planId });
      await setAsDefaultMutation({ planId });
    },
    [setAsDefaultMutation]
  );

  const deletePlanDesc = 'This will also delete any AI chats and insights associated with this plan, and cannot be undone.';

  return (
    <>
      <div className="-mx-2 sm:-mx-3 lg:-mx-4 lg:pr-96">
        <header className="from-emphasized-background to-background border-border/50 flex items-center justify-between border-b bg-gradient-to-l px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <Heading level={3}>Plans</Heading>
          <Button color="rose" onClick={() => setPlanDialogOpen(true)}>
            <PlusIcon />
            Create
          </Button>
        </header>
        <ul role="list" className="divide-border/25 divide-y">
          {plans?.map((plan) => {
            const planMetadata = { id: plan._id, name: plan.name };
            return (
              <PlanListItem
                key={plan._id}
                plan={plan}
                disableActions={{ disableDelete: plans.length <= 1 || plan.isDefault }}
                onDropdownClickEdit={() => handleEdit(plan)}
                onDropdownClickClone={() => handleClone(planMetadata)}
                onDropdownClickDelete={() => setPlanToDelete(planMetadata)}
                onDropdownClickSetAsDefault={() => handleSetAsDefault(plan._id)}
              />
            );
          })}
        </ul>
      </div>
      <Finances preloadedAssets={preloadedAssets} preloadedLiabilities={preloadedLiabilities} />
      <Dialog size="xl" open={planDialogOpen} onClose={handlePlanDialogClose}>
        <PlanDialog
          numPlans={plans?.length ?? 0}
          selectedPlan={selectedPlan}
          allPlans={allPlans}
          planToClone={planToClone}
          onClose={handlePlanDialogClose}
        />
      </Dialog>
      <DeleteDataItemAlert dataToDelete={planToDelete} setDataToDelete={setPlanToDelete} deleteData={deletePlan} desc={deletePlanDesc} />
    </>
  );
}
