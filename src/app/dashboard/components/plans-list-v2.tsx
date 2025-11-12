'use client';

import { useMemo, useState, useCallback } from 'react';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { Preloaded, usePreloadedQuery } from 'convex/react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { EllipsisVerticalIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/catalyst/alert';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/catalyst/dropdown';
import { useSimulationResult, useKeyMetrics, useIsCalculationReady } from '@/lib/stores/simulator-store';
import { simulatorFromConvex } from '@/lib/utils/convex-to-zod-transformers';

import PlanDialog from './dialogs/plan-dialog';

const activityItems = [
  {
    user: {
      name: 'Michael Foster',
      imageUrl:
        'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    projectName: 'ios-app',
    commit: '2d89f0c8',
    branch: 'main',
    date: '1h',
    dateTime: '2023-01-23T11:00',
  },
  {
    user: {
      name: 'Lindsay Walton',
      imageUrl:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    projectName: 'mobile-api',
    commit: '249df660',
    branch: 'main',
    date: '3h',
    dateTime: '2023-01-23T09:00',
  },
  {
    user: {
      name: 'Courtney Henry',
      imageUrl:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    projectName: 'ios-app',
    commit: '11464223',
    branch: 'main',
    date: '12h',
    dateTime: '2023-01-23T00:00',
  },
  {
    user: {
      name: 'Courtney Henry',
      imageUrl:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    projectName: 'company-website',
    commit: 'dad28e95',
    branch: 'main',
    date: '2d',
    dateTime: '2023-01-21T13:00',
  },
  {
    user: {
      name: 'Michael Foster',
      imageUrl:
        'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    projectName: 'relay-service',
    commit: '624bc94c',
    branch: 'main',
    date: '5d',
    dateTime: '2023-01-18T12:34',
  },
  {
    user: {
      name: 'Courtney Henry',
      imageUrl:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    projectName: 'api.protocol.chat',
    commit: 'e111f80e',
    branch: 'main',
    date: '1w',
    dateTime: '2023-01-16T15:54',
  },
  {
    user: {
      name: 'Michael Foster',
      imageUrl:
        'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    projectName: 'api.protocol.chat',
    commit: '5e136005',
    branch: 'main',
    date: '1w',
    dateTime: '2023-01-16T11:31',
  },
  {
    user: {
      name: 'Whitney Francis',
      imageUrl:
        'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    projectName: 'ios-app',
    commit: '5c1fd07f',
    branch: 'main',
    date: '2w',
    dateTime: '2023-01-09T08:45',
  },
];

interface PlanListItems {
  plan: Doc<'plans'>;
  onDropdownClickEdit: () => void;
  onDropdownClickClone: () => void;
  onDropdownClickDelete: () => void;
  disableActions: { disableEdit?: boolean; disableClone?: boolean; disableDelete?: boolean };
}

function PlanListItem({ plan, onDropdownClickEdit, onDropdownClickClone, onDropdownClickDelete, disableActions }: PlanListItems) {
  const inputs = useMemo(() => simulatorFromConvex(plan), [plan]);

  const isCalculationReady = useIsCalculationReady(inputs);
  const simulation = useSimulationResult(inputs, 'fixedReturns');
  const keyMetrics = useKeyMetrics(simulation);

  const status = !isCalculationReady ? 'In progress' : keyMetrics?.success ? 'Success' : 'Failed';

  const { disableEdit, disableClone, disableDelete } = disableActions;

  return (
    <li key={plan._id} className="relative flex items-center space-x-4 px-4 py-4 sm:px-6 lg:px-8">
      <div className="min-w-0 flex-auto">
        <div className="flex items-center gap-x-3">
          <p className="text-sm/6 font-semibold text-zinc-900 dark:text-white">{plan.name}</p>
          {status === 'In progress' ? (
            <p className="mt-0.5 rounded-md bg-zinc-50 px-1.5 py-0.5 text-xs font-medium text-zinc-600 inset-ring inset-ring-zinc-500/10 dark:bg-zinc-400/10 dark:text-zinc-400 dark:inset-ring-zinc-400/20">
              {status}
            </p>
          ) : null}
          {status === 'Success' ? (
            <p className="mt-0.5 rounded-md bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 inset-ring inset-ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:inset-ring-green-500/20">
              {status}
            </p>
          ) : null}
          {status === 'Failed' ? (
            <p className="mt-0.5 rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700 inset-ring inset-ring-red-600/20 dark:bg-red-400/10 dark:text-red-400 dark:inset-ring-red-500/20">
              {status}
            </p>
          ) : null}
        </div>
        <div className="mt-1 flex items-center gap-x-2 text-xs/5 text-zinc-500 dark:text-zinc-400">
          <p className="whitespace-nowrap">Created {new Date(plan._creationTime).toLocaleDateString()}</p>
          <svg viewBox="0 0 2 2" className="size-0.5 fill-current">
            <circle r={1} cx={1} cy={1} />
          </svg>
          <p className="truncate">Created by Joe</p>
        </div>
      </div>
      <div className="flex flex-none items-center gap-x-4">
        <Link
          href={`/dashboard/simulator/${plan._id}`}
          className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-zinc-900 shadow-xs inset-ring inset-ring-zinc-300 hover:bg-zinc-50 sm:block dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
        >
          View plan<span className="sr-only">, {plan.name}</span>
        </Link>
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

interface PlanListV2Props {
  preloadedPlans: Preloaded<typeof api.plans.listPlans>;
}

export default function PlanListV2({ preloadedPlans }: PlanListV2Props) {
  const plans = usePreloadedQuery(preloadedPlans);
  const allPlans = useMemo(() => plans.map((plan) => ({ id: plan._id, name: plan.name })), [plans]);

  const [planDialogOpen, setPlanDialogOpen] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState<{ id: Id<'plans'>; name: string } | null>(null);
  const [planToClone, setPlanToClone] = useState<{ id: Id<'plans'>; name: string } | undefined>(undefined);

  const handleClose = () => {
    setSelectedPlan(null);
    setPlanToClone(undefined);
    setPlanDialogOpen(false);
  };

  const handleEdit = (plan: { id: Id<'plans'>; name: string }) => {
    setSelectedPlan(plan);
    setPlanDialogOpen(true);
  };

  const handleClone = (plan: { id: Id<'plans'>; name: string }) => {
    setPlanToClone(plan);
    setPlanDialogOpen(true);
  };

  const [planToDelete, setPlanToDelete] = useState<{ id: Id<'plans'>; name: string } | null>(null);
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
          <h1 className="text-base/7 font-semibold text-zinc-900 dark:text-white">Your Plans</h1>
          <Menu as="div" className="relative">
            <MenuButton className="flex items-center gap-x-1 text-sm/6 font-medium text-zinc-900 dark:text-white">
              Sort by
              <ChevronUpDownIcon aria-hidden="true" className="size-5 text-zinc-500" />
            </MenuButton>
            <MenuItems
              transition
              className="absolute right-0 z-10 mt-2.5 w-40 origin-top-right rounded-md bg-white py-2 shadow-lg outline-1 outline-zinc-900/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in dark:bg-zinc-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
            >
              <MenuItem>
                <a
                  href="#"
                  className="block px-3 py-1 text-sm/6 text-zinc-900 data-focus:bg-zinc-50 data-focus:outline-hidden dark:text-white dark:data-focus:bg-white/5"
                >
                  Name
                </a>
              </MenuItem>
              <MenuItem>
                <a
                  href="#"
                  className="block px-3 py-1 text-sm/6 text-zinc-900 data-focus:bg-zinc-50 data-focus:outline-hidden dark:text-white dark:data-focus:bg-white/5"
                >
                  Date updated
                </a>
              </MenuItem>
              <MenuItem>
                <a
                  href="#"
                  className="block px-3 py-1 text-sm/6 text-zinc-900 data-focus:bg-zinc-50 data-focus:outline-hidden dark:text-white dark:data-focus:bg-white/5"
                >
                  Environment
                </a>
              </MenuItem>
            </MenuItems>
          </Menu>
        </header>
        <ul role="list" className="divide-border/25 divide-y">
          {plans.map((plan) => {
            const planMetadata = { id: plan._id, name: plan.name };
            return (
              <PlanListItem
                key={plan._id}
                plan={plan}
                disableActions={{ disableDelete: plans.length <= 1 }}
                onDropdownClickEdit={() => handleEdit(planMetadata)}
                onDropdownClickClone={() => handleClone(planMetadata)}
                onDropdownClickDelete={() => setPlanToDelete(planMetadata)}
              />
            );
          })}
        </ul>
      </div>
      <aside className="border-border/50 -mx-2 border-t bg-zinc-50 sm:-mx-3 lg:fixed lg:top-[4.3125rem] lg:right-0 lg:bottom-0 lg:mx-0 lg:w-96 lg:overflow-y-auto lg:border-t-0 lg:border-l dark:bg-black/10">
        <header className="from-emphasized-background to-background border-border/50 flex items-center justify-between border-b bg-gradient-to-l px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <h2 className="text-base/7 font-semibold text-zinc-900 dark:text-white">Your Finances</h2>
          <a href="#" className="text-sm/6 font-semibold text-rose-600 dark:text-rose-400">
            View all
          </a>
        </header>
        <ul role="list" className="divide-border/25 divide-y">
          {activityItems.map((item) => (
            <li key={item.commit} className="px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-x-3">
                <Image
                  width={24}
                  height={24}
                  alt=""
                  src={item.user.imageUrl}
                  className="size-6 flex-none rounded-full bg-zinc-100 outline -outline-offset-1 outline-black/5 dark:bg-zinc-800 dark:outline-white/10"
                />
                <h3 className="flex-auto truncate text-sm/6 font-semibold text-zinc-900 dark:text-white">{item.user.name}</h3>
                <time dateTime={item.dateTime} className="flex-none text-xs text-zinc-500 dark:text-zinc-600">
                  {item.date}
                </time>
              </div>
              <p className="mt-3 truncate text-sm text-zinc-500">
                Pushed to <span className="text-zinc-700 dark:text-zinc-400">{item.projectName}</span> (
                <span className="font-mono text-zinc-700 dark:text-zinc-400">{item.commit}</span> on{' '}
                <span className="text-zinc-700 dark:text-zinc-400">{item.branch}</span>)
              </p>
            </li>
          ))}
        </ul>
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
        <AlertActions>
          <Button plain onClick={() => setPlanToDelete(null)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={async () => {
              await deletePlan(planToDelete!.id);
              setPlanToDelete(null);
            }}
          >
            Delete
          </Button>
        </AlertActions>
      </Alert>
    </>
  );
}
