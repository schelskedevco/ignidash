'use client';

import { CreditCardIcon } from 'lucide-react';

import { Fieldset, FieldGroup, Legend, Field, Description } from '@/components/catalyst/fieldset';
import { Button } from '@/components/catalyst/button';
import Card from '@/components/ui/card';
import { Badge } from '@/components/catalyst/badge';

interface BillingFormProps {
  subscriptions: { plan: string; status: string | null | undefined }[];
}

export default function BillingForm({ subscriptions }: BillingFormProps) {
  const openBillingPortal = async () => {};

  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === 'active');

  return (
    <Card className="my-6">
      <form onSubmit={(e) => e.preventDefault()}>
        <Fieldset>
          <Legend className="flex items-center gap-2">
            <CreditCardIcon className="text-primary h-6 w-6" aria-hidden="true" />
            Billing status
            {activeSubscriptions.length > 0 ? <Badge color="green">Active</Badge> : <Badge color="zinc">Inactive</Badge>}
          </Legend>
          <FieldGroup>
            <Field>
              <Button color="rose" type="button" className="w-full" data-slot="control" onClick={openBillingPortal}>
                Open billing portal
              </Button>
              <Description>Visit the billing portal to manage your subscription, update payment methods, and view invoices.</Description>
            </Field>
          </FieldGroup>
        </Fieldset>
      </form>
    </Card>
  );
}
