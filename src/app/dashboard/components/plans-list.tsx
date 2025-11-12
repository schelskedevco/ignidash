'use client';

import { useMemo } from 'react';
import { PencilSquareIcon } from '@heroicons/react/20/solid';
import { Doc } from '@/convex/_generated/dataModel';
import { Preloaded, usePreloadedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

import type { SimulationResult } from '@/lib/calc/simulation-engine';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import Card from '@/components/ui/card';
import SectionContainer from '@/components/ui/section-container';
import { Heading, Subheading } from '@/components/catalyst/heading';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/catalyst/dropdown';
import { Select } from '@/components/catalyst/select';
import {
  useResultsCategory,
  useUpdateResultsCategory,
  useSimulationResult,
  useKeyMetrics,
  useSingleSimulationPortfolioChartData,
} from '@/lib/stores/simulator-store';
import { simulatorFromConvex } from '@/lib/utils/convex-to-zod-transformers';
import { formatNumber } from '@/lib/utils';
import { SimulationCategory } from '@/lib/types/simulation-category';

import PortfolioPreviewChart from './charts.tsx/portfolio-preview-chart';

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
}

function PlanCard({ plan }: PlanCardProps) {
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
              <PencilSquareIcon />
            </DropdownButton>
            <DropdownMenu portal={false}>
              <DropdownItem onClick={() => {}}>Edit</DropdownItem>
              <DropdownItem onClick={() => {}}>Delete</DropdownItem>
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

  const resultsCategory = useResultsCategory();
  const updateResultsCategory = useUpdateResultsCategory();

  return (
    <SectionContainer showBottomBorder={false}>
      <div className="mx-2 mb-4 flex items-center justify-between">
        <Heading level={3}>Simulations</Heading>
        <Select
          className="max-w-48 sm:max-w-64"
          id="results-category-select"
          name="results-category-select"
          value={resultsCategory}
          onChange={(e) => updateResultsCategory(e.target.value as SimulationCategory)}
        >
          <option value={SimulationCategory.Portfolio}>{SimulationCategory.Portfolio}</option>
          <option value={SimulationCategory.CashFlow}>{SimulationCategory.CashFlow}</option>
          <option value={SimulationCategory.Taxes}>{SimulationCategory.Taxes}</option>
          <option value={SimulationCategory.Returns}>{SimulationCategory.Returns}</option>
          <option value={SimulationCategory.Contributions}>{SimulationCategory.Contributions}</option>
          <option value={SimulationCategory.Withdrawals}>{SimulationCategory.Withdrawals}</option>
        </Select>
      </div>
      <div className="grid w-full grid-cols-1 gap-2 xl:grid-cols-2">
        {plans.map((plan) => (
          <PlanCard key={plan._id} plan={plan} />
        ))}
      </div>
    </SectionContainer>
  );
}
