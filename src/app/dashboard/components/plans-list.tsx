'use client';

import { ConvexError } from 'convex/values';
import { useMemo, useState, useCallback } from 'react';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { Preloaded, usePreloadedQuery } from 'convex/react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { PlusIcon, PencilSquareIcon } from '@heroicons/react/16/solid';

import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { Heading } from '@/components/catalyst/heading';
import { Alert, AlertActions, AlertDescription, AlertTitle, AlertBody } from '@/components/catalyst/alert';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/catalyst/dropdown';
import { useSimulationResult, useKeyMetrics, useIsCalculationReady } from '@/lib/stores/simulator-store';
import { simulatorFromConvex } from '@/lib/utils/convex-to-zod-transformers';

import PlanDialog from './dialogs/plan-dialog';

interface PlanListItems {
  plan: Doc<'plans'>;
  onDropdownClickEdit: () => void;
  onDropdownClickClone: () => void;
  onDropdownClickDelete: () => void;
  disableActions: { disableEdit?: boolean; disableClone?: boolean; disableDelete?: boolean };
}

function PlanListItem({ plan, onDropdownClickEdit, onDropdownClickClone, onDropdownClickDelete, disableActions }: PlanListItems) {
  const inputs = useMemo(() => simulatorFromConvex(plan), [plan]);

  const { timelineIsReady, accountsAreReady, incomesAreReady, expensesAreReady } = useIsCalculationReady(inputs);
  const isCalculationReady = timelineIsReady && accountsAreReady && incomesAreReady && expensesAreReady;

  const simulation = useSimulationResult(inputs, 'fixedReturns');
  const keyMetrics = useKeyMetrics(simulation);

  const status = !isCalculationReady ? 'In progress' : keyMetrics?.success ? 'Success' : 'Failed';

  const { disableEdit, disableClone, disableDelete } = disableActions;

  return (
    <li
      key={plan._id}
      className="relative flex items-center space-x-4 px-4 py-4 hover:bg-zinc-50 sm:px-6 lg:px-8 dark:hover:dark:bg-black/10"
    >
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
        <Button outline href={`/dashboard/simulator/${plan._id}`}>
          View plan<span className="sr-only">, {plan.name}</span>
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
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </li>
  );
}

interface PlanListProps {
  preloadedPlans: Preloaded<typeof api.plans.listPlans>;
}

export default function PlanList({ preloadedPlans }: PlanListProps) {
  const plans = usePreloadedQuery(preloadedPlans);
  const allPlans = useMemo(() => plans.map((plan) => ({ id: plan._id, name: plan.name })), [plans]);

  const [planDialogOpen, setPlanDialogOpen] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState<Doc<'plans'> | null>(null);
  const [planToClone, setPlanToClone] = useState<{ id: Id<'plans'>; name: string } | undefined>(undefined);

  const handleClose = () => {
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

  const [planToDelete, setPlanToDelete] = useState<{ id: Id<'plans'>; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteMutation = useMutation(api.plans.deletePlan);
  const deletePlan = useCallback(
    async (planId: Id<'plans'>) => {
      await deleteMutation({ planId });
    },
    [deleteMutation]
  );

  return (
    <>
      <div className="-mx-2 sm:-mx-3 lg:-mx-4 lg:pr-96">
        <header className="from-emphasized-background to-background border-border/50 flex items-center justify-between border-b bg-gradient-to-l px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <Heading level={3}>Your Plans</Heading>
          <Button color="rose" onClick={() => setPlanDialogOpen(true)}>
            <PlusIcon />
            Create
          </Button>
        </header>
        <ul role="list" className="divide-border/25 divide-y">
          {plans.map((plan) => {
            const planMetadata = { id: plan._id, name: plan.name };
            return (
              <PlanListItem
                key={plan._id}
                plan={plan}
                disableActions={{ disableDelete: plans.length <= 1 }}
                onDropdownClickEdit={() => handleEdit(plan)}
                onDropdownClickClone={() => handleClone(planMetadata)}
                onDropdownClickDelete={() => setPlanToDelete(planMetadata)}
              />
            );
          })}
        </ul>
      </div>
      <aside className="border-border/50 -mx-2 border-t bg-zinc-50 sm:-mx-3 lg:fixed lg:top-[4.3125rem] lg:right-0 lg:bottom-0 lg:mx-0 lg:w-96 lg:overflow-y-auto lg:border-t-0 lg:border-l dark:bg-black/10">
        <header className="from-emphasized-background to-background border-border/50 flex items-center justify-between border-b bg-gradient-to-l px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <Heading level={4}>Your Finances</Heading>
          <Button outline onClick={() => {}}>
            <PencilSquareIcon />
            Edit
          </Button>
        </header>
      </aside>
      <Dialog size="xl" open={planDialogOpen} onClose={handleClose}>
        <PlanDialog
          numPlans={plans.length}
          selectedPlan={selectedPlan}
          allPlans={allPlans}
          planToClone={planToClone}
          onClose={handleClose}
        />
      </Dialog>
      <Alert
        open={!!planToDelete}
        onClose={() => {
          setPlanToDelete(null);
        }}
      >
        <AlertTitle>Are you sure you want to delete {planToDelete ? `"${planToDelete.name}"` : 'this'}?</AlertTitle>
        <AlertDescription>This action cannot be undone.</AlertDescription>
        <AlertBody>{deleteError && <ErrorMessageCard errorMessage={deleteError} />}</AlertBody>
        <AlertActions>
          <Button plain onClick={() => setPlanToDelete(null)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            color="red"
            disabled={isDeleting}
            onClick={async () => {
              setIsDeleting(true);
              setDeleteError(null);
              try {
                await deletePlan(planToDelete!.id);
                setPlanToDelete(null);
              } catch (error) {
                setDeleteError(error instanceof ConvexError ? error.message : 'Failed to delete.');
                console.error('Error during deletion: ', error);
              } finally {
                setIsDeleting(false);
              }
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </AlertActions>
      </Alert>
    </>
  );
}
