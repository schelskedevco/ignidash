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
      <Heading level={3} className="mt-4 mb-2">
        Simulations
      </Heading>
      <div className="grid w-full grid-cols-1 gap-2 lg:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan._id} className="w-full">
            <Subheading>{plan.name}</Subheading>
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
