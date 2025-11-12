'use client';

import { useMemo, useState, useCallback } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/16/solid';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { Preloaded, usePreloadedQuery } from 'convex/react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

import type { SimulationResult } from '@/lib/calc/simulation-engine';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import Card from '@/components/ui/card';
import SectionContainer from '@/components/ui/section-container';
import { Heading, Subheading } from '@/components/catalyst/heading';
import { Divider } from '@/components/catalyst/divider';
import { DialogActions } from '@/components/catalyst/dialog';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/catalyst/dropdown';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/catalyst/alert';
import { useSimulationResult, useKeyMetrics, useSingleSimulationPortfolioChartData } from '@/lib/stores/simulator-store';
import { simulatorFromConvex } from '@/lib/utils/convex-to-zod-transformers';
import { formatNumber } from '@/lib/utils';

import PortfolioPreviewChart from './charts/portfolio-preview-chart';
import PlanDialog from './dialogs/plan-dialog';

interface PlanChartProps {
  simulation: SimulationResult;
  keyMetrics: KeyMetrics;
}

function PlanChart({ simulation, keyMetrics }: PlanChartProps) {
  const rawChartData = useSingleSimulationPortfolioChartData(simulation);
  const startAge = simulation.context.startAge;

  return <PortfolioPreviewChart rawChartData={rawChartData} startAge={startAge} keyMetrics={keyMetrics} />;
}

interface PlanCardProps {
  plan: Doc<'plans'>;
  onDropdownClickEdit: () => void;
  onDropdownClickClone: () => void;
  onDropdownClickDelete: () => void;
  disableActions: { disableEdit?: boolean; disableClone?: boolean; disableDelete?: boolean };
}

function PlanCard({ plan, onDropdownClickEdit, onDropdownClickClone, onDropdownClickDelete, disableActions }: PlanCardProps) {
  const inputs = useMemo(() => simulatorFromConvex(plan), [plan]);

  const simulation = useSimulationResult(inputs, 'fixedReturns');
  const keyMetrics = useKeyMetrics(simulation);

  const { disableEdit, disableClone, disableDelete } = disableActions;

  return (
    <Card key={plan._id} className="my-0 w-full">
      <div className="mb-4 flex items-center justify-between">
        <Subheading level={4} className="flex flex-col">
          <span className="mr-2">{plan.name}</span>
          <span className="text-muted-foreground hidden sm:inline">Created {new Date(plan._creationTime).toLocaleDateString()}</span>
        </Subheading>
        <div className="shrink-0">
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
      {simulation && keyMetrics && <PlanChart simulation={simulation} keyMetrics={keyMetrics} />}
      {false && (
        <DescriptionList>
          <DescriptionTerm>Portfolio Value</DescriptionTerm>
          <DescriptionDetails>
            {formatNumber(
              plan.accounts.reduce((total, account) => total + account.balance, 0),
              0,
              '$'
            )}
          </DescriptionDetails>
          <DescriptionTerm>Retirement Strategy</DescriptionTerm>
          <DescriptionDetails>...</DescriptionDetails>
        </DescriptionList>
      )}
      <Divider className="my-4" />
      <DialogActions>
        <Button outline href={`/dashboard/simulator/${plan._id}`}>
          View <span aria-hidden="true">→</span>
        </Button>
      </DialogActions>
    </Card>
  );
}

interface PlansListProps {
  preloadedPlans: Preloaded<typeof api.plans.listPlans>;
}

export default function PlansList({ preloadedPlans }: PlansListProps) {
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
      <SectionContainer showBottomBorder={false}>
        <div className="mx-auto max-w-3xl lg:max-w-5xl xl:max-w-7xl">
          <div className="mx-2 mb-4 flex items-center justify-between">
            <Heading level={3}>Simulations</Heading>
            <Button color="rose" onClick={() => setPlanDialogOpen(true)}>
              <PlusIcon />
              Create
            </Button>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 lg:grid-cols-2">
            {plans.map((plan) => {
              const planMetadata = { id: plan._id, name: plan.name };
              return (
                <PlanCard
                  key={plan._id}
                  plan={plan}
                  disableActions={{ disableDelete: plans.length <= 1 }}
                  onDropdownClickEdit={() => handleEdit(planMetadata)}
                  onDropdownClickClone={() => handleClone(planMetadata)}
                  onDropdownClickDelete={() => setPlanToDelete(planMetadata)}
                />
              );
            })}
          </div>
        </div>
      </SectionContainer>
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
