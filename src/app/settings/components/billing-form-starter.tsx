'use client';

import { CreditCardIcon } from 'lucide-react';

import { Fieldset, FieldGroup, Legend, Field, Description } from '@/components/catalyst/fieldset';
import { Button } from '@/components/catalyst/button';
import Card from '@/components/ui/card';
import { Badge } from '@/components/catalyst/badge';

export default function BillingFormStarter() {
  return (
    <Card className="my-6">
      <form onSubmit={(e) => e.preventDefault()}>
        <Fieldset>
          <Legend className="flex flex-wrap items-center gap-2">
            <CreditCardIcon className="text-primary h-6 w-6" aria-hidden="true" />
            Billing status
            <Badge color="red">Not active</Badge>
          </Legend>
          <FieldGroup>
            <Field>
              <Button color="rose" type="button" className="w-full" data-slot="control" href="/pricing">
                Upgrade to Pro
              </Button>
              <Description>Upgrade to Pro to access AI chat and insights.</Description>
            </Field>
          </FieldGroup>
        </Fieldset>
      </form>
    </Card>
  );
}
