import { useState, useEffect, useCallback } from 'react';

import { authClient } from '@/lib/auth-client';

type CustomerState = {
  id: string;
};

type Subscription = {
  id: string;
};

export function useCustomerState() {
  const [customerState, setCustomerState] = useState<CustomerState | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);

    Promise.all([authClient.customer.state(), authClient.customer.subscriptions.list({ query: { limit: 1 } })])
      .then(([{ data: customerData, error: customerError }, { data: subscriptionsData, error: subscriptionsError }]) => {
        if (!mounted) return;

        if (customerError) {
          setError(new Error(customerError.message));
          setCustomerState(null);
        } else {
          setCustomerState(customerData);
        }

        if (subscriptionsError) {
          setError(new Error(subscriptionsError.message));
          setSubscription(null);
        } else {
          setSubscription(subscriptionsData.result.items[0]);
        }
      })
      .catch((err) => mounted && setError(err))
      .finally(() => mounted && setIsLoading(false));

    return () => {
      mounted = false;
    };
  }, [refetchTrigger]);

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  return { customerState, subscription, isLoading, error, refetch };
}
