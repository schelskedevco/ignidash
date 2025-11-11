'use client';

import { Preloaded, usePreloadedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

import Card from '@/components/ui/card';
import { Heading, Subheading } from '@/components/catalyst/heading';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { formatNumber } from '@/lib/utils';

interface PlansListProps {
  preloadedPlans: Preloaded<typeof api.plans.listPlans>;
}

export default function PlansList({ preloadedPlans }: PlansListProps) {
  const plans = usePreloadedQuery(preloadedPlans);

  return (
    <>
      <Heading level={3} className="mx-2 my-4">
        Simulations
      </Heading>
      <div className="grid w-full grid-cols-1 gap-2 lg:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan._id} className="my-0 w-full">
            <Subheading level={4}>
              <span className="mr-2">{plan.name}</span>
              <span className="text-muted-foreground hidden sm:inline">{new Date(plan._creationTime).toLocaleDateString()}</span>
            </Subheading>
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
          </Card>
        ))}
      </div>
    </>
  );
}
