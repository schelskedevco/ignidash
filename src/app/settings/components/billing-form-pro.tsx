'use client';

import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState, useEffect } from 'react';
import { CreditCardIcon } from 'lucide-react';
import posthog from 'posthog-js';

import { Fieldset, FieldGroup, Legend, Field, Description, ErrorMessage } from '@/components/catalyst/fieldset';
import { Button } from '@/components/catalyst/button';
import Card from '@/components/ui/card';
import { Badge } from '@/components/catalyst/badge';
import { authClient } from '@/lib/auth-client';

interface BillingFormProProps {
  subscriptions: { plan: string; status: string | null | undefined; id: string | null | undefined }[];
}

export default function BillingFormPro({ subscriptions }: BillingFormProProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelAtTime, setCancelAtTime] = useState<number | null>(null);

  const openBillingPortal = async () => {
    setIsLoading(true);
    setError(null);

    posthog.capture('open_billing_portal');

    const { error } = await authClient.subscription.billingPortal({ returnUrl: '/settings' });

    if (error && error.message) setError(error.message);
    setIsLoading(false);
  };

  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === 'active' || subscription.status === 'trialing'
  );

  const a = useAction(api.auth.getStripeSubscription);
  useEffect(() => {
    const subscriptionId = activeSubscriptions[0]?.id;
    if (!subscriptionId) return;

    a({ subscriptionId }).then((subscription) => {
      if (subscription?.cancel_at) setCancelAtTime(subscription.cancel_at);
    });
  }, [activeSubscriptions, a]);

  return (
    <Card className="my-6">
      <form onSubmit={(e) => e.preventDefault()}>
        <Fieldset>
          <Legend className="flex flex-wrap items-center gap-2">
            <CreditCardIcon className="text-primary h-6 w-6" aria-hidden="true" />
            Billing status
            {activeSubscriptions.length > 0 ? (
              <Badge color="green">{activeSubscriptions[0].status === 'active' ? 'Active' : 'Free trial'}</Badge>
            ) : (
              <Badge color="stone">Inactive</Badge>
            )}
            {cancelAtTime && <Badge color="red">Cancels at {new Date(cancelAtTime * 1000).toLocaleDateString()}</Badge>}
          </Legend>
          <FieldGroup>
            <Field>
              <Button color="rose" type="button" className="w-full" data-slot="control" onClick={openBillingPortal} disabled={isLoading}>
                Open billing portal
              </Button>
              {error && <ErrorMessage>{error}</ErrorMessage>}
              <Description>Visit the billing portal to manage your subscription, update payment methods, and view invoices.</Description>
            </Field>
          </FieldGroup>
        </Fieldset>
      </form>
    </Card>
  );
}
