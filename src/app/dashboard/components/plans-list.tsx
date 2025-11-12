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
  onDropdownClickDelete: () => void;
}

function PlanCard({ plan, onDropdownClickEdit, onDropdownClickDelete }: PlanCardProps) {
  const inputs = useMemo(() => simulatorFromConvex(plan), [plan]);

  const simulation = useSimulationResult(inputs, 'fixedReturns');
  const keyMetrics = useKeyMetrics(simulation);

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
              <DropdownItem onClick={onDropdownClickEdit}>Edit</DropdownItem>
              <DropdownItem onClick={onDropdownClickDelete}>Delete</DropdownItem>
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

  const handleClose = () => {
    setSelectedPlan(null);
    setPlanDialogOpen(false);
  };

  const handleEdit = (plan: { id: Id<'plans'>; name: string }) => {
    setSelectedPlan(plan);
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
        <div className="mx-2 mb-4 flex items-center justify-between">
          <Heading level={3}>Simulations</Heading>
          <Button color="rose" onClick={() => setPlanDialogOpen(true)}>
            <PlusIcon />
            Create Plan
          </Button>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 xl:grid-cols-2">
          {plans.map((plan) => {
            const planMetadata = { id: plan._id, name: plan.name };

            return (
              <PlanCard
                key={plan._id}
                plan={plan}
                onDropdownClickEdit={() => handleEdit(planMetadata)}
                onDropdownClickDelete={() => setPlanToDelete(planMetadata)}
              />
            );
          })}
        </div>
      </SectionContainer>
      <Dialog size="xl" open={planDialogOpen} onClose={handleClose}>
        <PlanDialog numPlans={plans.length} selectedPlan={selectedPlan} allPlans={allPlans} onClose={handleClose} />
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
