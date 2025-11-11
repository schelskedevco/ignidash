'use client';

import { PencilSquareIcon } from '@heroicons/react/20/solid';
import { Preloaded, usePreloadedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

import Card from '@/components/ui/card';
import { Heading, Subheading } from '@/components/catalyst/heading';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/catalyst/dropdown';
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
      <div className="grid w-full grid-cols-1 gap-2 xl:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan._id} className="my-0 w-full">
            <div className="mb-4 flex items-center justify-between">
              <Subheading level={4}>
                <span className="mr-2">{plan.name}</span>
                <span className="text-muted-foreground hidden sm:inline">{new Date(plan._creationTime).toLocaleDateString()}</span>
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
